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

// ─── Sanitizers ──────────────────────────────────────────────────────────────
function sanitizeList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
}

function sanitizeBoard(board) {
  if (!board || typeof board !== "object") return null;
  return {
    id: String(board.id || "").trim(),
    label: String(board.label || "").trim(),
    syllabus: String(board.syllabus || "").trim(),
    modules: sanitizeList(board.modules),
    examStructure: sanitizeList(board.examStructure),
    skills: sanitizeList(board.skills),
  };
}

function sanitizeLevel(level) {
  if (!level || typeof level !== "object") return null;
  return {
    id: String(level.id || "").trim(),
    label: String(level.label || "").trim(),
    boards: Array.isArray(level.boards)
      ? level.boards.map(sanitizeBoard).filter(Boolean)
      : [],
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────
function validateInput(body) {
  const errors = [];
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.push("Subject title is required.");
  }
  if (body.levels !== undefined && !Array.isArray(body.levels)) {
    errors.push("Levels must be an array.");
  }
  return errors;
}

// ─── POST: Create Subject ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    const errors = validateInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const docRef = doc(collection(db, "subjects"));
    const subjectData = {
      id: docRef.id,
      num: String(body.num || "").trim(),
      title: String(body.title || "").trim(),
      tag: String(body.tag || "").trim(),
      badgeType: String(body.badgeType || "gray-outline").trim(),
      description: String(body.description || "").trim(),
      tutor: String(body.tutor || "").trim(),
      levels: Array.isArray(body.levels)
        ? body.levels.map(sanitizeLevel).filter(Boolean)
        : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, subjectData);

    return NextResponse.json(
      { success: true, id: docRef.id, message: "Subject created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/subjects error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to create subject." },
      { status: 500 }
    );
  }
}

// ─── PUT: Update Subject ─────────────────────────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json(
        { success: false, errors: ["Subject ID is required for updates."] },
        { status: 400 }
      );
    }

    const errors = validateInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const docId = body.id.trim();
    const updateData = {
      id: docId,
      num: String(body.num || "").trim(),
      title: String(body.title || "").trim(),
      tag: String(body.tag || "").trim(),
      badgeType: String(body.badgeType || "gray-outline").trim(),
      description: String(body.description || "").trim(),
      tutor: String(body.tutor || "").trim(),
      levels: Array.isArray(body.levels)
        ? body.levels.map(sanitizeLevel).filter(Boolean)
        : [],
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "subjects", docId), updateData);

    return NextResponse.json(
      { success: true, id: docId, message: "Subject updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/subjects error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to update subject." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete Subject ──────────────────────────────────────────────────
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
        { success: false, error: "Subject ID is required for deletion." },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "subjects", id.trim()));

    return NextResponse.json(
      { success: true, id: id.trim(), message: "Subject deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/subjects error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to delete subject." },
      { status: 500 }
    );
  }
}
