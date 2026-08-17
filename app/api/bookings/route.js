import { NextResponse } from "next/server";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();

    const errors = [];
    if (!body.studentName || typeof body.studentName !== "string" || !body.studentName.trim()) {
      errors.push("Student name is required.");
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid contact email is required.");
    }
    if (!body.subject || typeof body.subject !== "string" || !body.subject.trim()) {
      errors.push("Subject selection is required.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const docRef = doc(collection(db, "bookings"));
    const bookingData = {
      id: docRef.id,
      studentName: String(body.studentName).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : "",
      teacherName: body.teacherName ? String(body.teacherName).trim() : "Unassigned",
      teacherId: body.teacherId ? String(body.teacherId).trim() : null,
      subject: String(body.subject).trim(),
      level: body.level ? String(body.level).trim() : "",
      date: body.date ? String(body.date).trim() : "",
      time: body.time ? String(body.time).trim() : "",
      duration: body.duration ? String(body.duration).trim() : "1 hour",
      notes: body.notes ? String(body.notes).trim() : "",
      status: "Upcoming",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, bookingData);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Session booking created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to create booking." },
      { status: 500 }
    );
  }
}
