import { NextResponse } from "next/server";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();

    const errors = [];
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Full Name is required.");
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required.");
    }
    if (!body.subject || typeof body.subject !== "string" || !body.subject.trim()) {
      errors.push("Teaching Subject is required.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const docRef = doc(collection(db, "career_applications"));
    const applicationData = {
      id: docRef.id,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : "",
      subject: String(body.subject).trim().toLowerCase(),
      experience: body.experience ? String(body.experience).trim() : "",
      qualifications: body.qualifications ? String(body.qualifications).trim() : "",
      cvUrl: body.cvUrl ? String(body.cvUrl).trim() : "",
      bio: body.bio ? String(body.bio).trim() : "",
      status: "Pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, applicationData);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Application submitted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to submit application." },
      { status: 500 }
    );
  }
}
