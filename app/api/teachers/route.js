import { NextResponse } from "next/server";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";

// ─── Input Validation Helper ────────────────────────────────────
function validateTeacherInput(body, isUpdate = false) {
  const errors = [];

  if (isUpdate && (!body.id || typeof body.id !== "string" || !body.id.trim())) {
    errors.push("A valid teacher ID is required for updates.");
  }

  if (!isUpdate || body.name !== undefined) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Full Name is required and must be a non-empty string.");
    }
  }

  if (!isUpdate || body.subject !== undefined) {
    if (!body.subject || typeof body.subject !== "string" || !body.subject.trim()) {
      errors.push("Subject is required and must be a non-empty string.");
    }
  }

  if (body.boards !== undefined && !Array.isArray(body.boards)) {
    errors.push("Boards must be an array of strings.");
  }

  if (body.highlights !== undefined && !Array.isArray(body.highlights)) {
    errors.push("Highlights must be an array of strings.");
  }

  if (
    body.availabilityStatus !== undefined &&
    !["available", "limited"].includes(body.availabilityStatus)
  ) {
    errors.push("Availability status must be either 'available' or 'limited'.");
  }

  return errors;
}

// ─── POST: Create Teacher ───────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Validation
    const validationErrors = validateTeacherInput(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    // 2. Prepare Sanitized Data with Server Metadata
    const newDocRef = doc(collection(db, "teachers"));
    const teacherId = newDocRef.id;

    const teacherData = {
      id: teacherId,
      name: String(body.name || "").trim(),
      role: String(body.role || "").trim(),
      image: String(body.image || "").trim(),
      subject: String(body.subject || "").trim(),
      subjectBookingParam: String(body.subjectBookingParam || body.subject || "").trim(),
      levels: String(body.levels || "").trim(),
      boards: Array.isArray(body.boards) ? body.boards : [],
      experience: String(body.experience || "").trim(),
      qualification: String(body.qualification || "").trim(),
      availability: String(body.availability || "Accepting New Students").trim(),
      availabilityStatus: body.availabilityStatus === "limited" ? "limited" : "available",
      bio: String(body.bio || "").trim(),
      highlights: Array.isArray(body.highlights)
        ? body.highlights.filter((h) => typeof h === "string" && h.trim() !== "")
        : [],
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Write to Firestore
    await setDoc(newDocRef, teacherData);

    return NextResponse.json(
      {
        success: true,
        id: teacherId,
        message: "Teacher profile created successfully.",
        data: teacherData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/teachers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to create teacher." },
      { status: 500 }
    );
  }
}

// ─── PUT / PATCH: Update Teacher ────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json();

    // 1. Validation
    const validationErrors = validateTeacherInput(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    const docId = String(body.id).trim();
    const docRef = doc(db, "teachers", docId);

    // 2. Prepare Updated Fields with Server Metadata
    const updateData = {
      id: docId,
      name: String(body.name || "").trim(),
      role: String(body.role || "").trim(),
      image: String(body.image || "").trim(),
      subject: String(body.subject || "").trim(),
      subjectBookingParam: String(body.subjectBookingParam || body.subject || "").trim(),
      levels: String(body.levels || "").trim(),
      boards: Array.isArray(body.boards) ? body.boards : [],
      experience: String(body.experience || "").trim(),
      qualification: String(body.qualification || "").trim(),
      availability: String(body.availability || "Accepting New Students").trim(),
      availabilityStatus: body.availabilityStatus === "limited" ? "limited" : "available",
      bio: String(body.bio || "").trim(),
      highlights: Array.isArray(body.highlights)
        ? body.highlights.filter((h) => typeof h === "string" && h.trim() !== "")
        : [],
      updatedAt: serverTimestamp(),
    };

    // 3. Update Firestore Document
    await updateDoc(docRef, updateData);

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Teacher profile updated successfully.",
        data: updateData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/teachers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to update teacher." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete Teacher ─────────────────────────────────────
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "A valid teacher ID is required for deletion." },
        { status: 400 }
      );
    }

    const docId = id.trim();
    await deleteDoc(doc(db, "teachers", docId));

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Teacher deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/teachers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to delete teacher." },
      { status: 500 }
    );
  }
}
