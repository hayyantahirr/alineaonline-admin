import { NextResponse } from "next/server";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();

    const errors = [];
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Name is required.");
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required.");
    }
    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      errors.push("Message cannot be empty.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const docRef = doc(collection(db, "contactMessages"));
    const messageData = {
      id: docRef.id,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : null,
      subject: body.subject ? String(body.subject).trim() : "General Inquiry",
      message: String(body.message).trim(),
      status: "unread",
      read: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, messageData);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Your message has been received successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to submit message." },
      { status: 500 }
    );
  }
}
