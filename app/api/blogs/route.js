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

// ─── Slug Generator ─────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

// ─── Input Validation ───────────────────────────────────────────
function validateBlogInput(body, isUpdate = false) {
  const errors = [];

  if (isUpdate && (!body.id || typeof body.id !== "string" || !body.id.trim())) {
    errors.push("A valid blog ID is required for updates.");
  }

  if (!isUpdate || body.title !== undefined) {
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      errors.push("Title is required and must be a non-empty string.");
    }
  }

  if (body.status !== undefined && !["Published", "Draft"].includes(body.status)) {
    errors.push("Status must be either 'Published' or 'Draft'.");
  }

  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    errors.push("Tags must be an array of strings.");
  }

  return errors;
}

// ─── POST: Create Blog ──────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    const validationErrors = validateBlogInput(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    const newDocRef = doc(collection(db, "blogs"));
    const blogId = newDocRef.id;
    const title = String(body.title || "").trim();

    const blogData = {
      id: blogId,
      title,
      slug: generateSlug(title),
      category: String(body.category || "").trim(),
      tags: Array.isArray(body.tags)
        ? body.tags.filter((t) => typeof t === "string" && t.trim() !== "")
        : [],
      featuredImage: String(body.featuredImage || "").trim(),
      readTime: String(body.readTime || "").trim(),
      author: String(body.author || "").trim(),
      status: body.status === "Published" ? "Published" : "Draft",
      content: String(body.content || "").trim(),
      excerpt: String(body.excerpt || "").trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, blogData);

    return NextResponse.json(
      {
        success: true,
        id: blogId,
        message: "Blog post created successfully.",
        data: blogData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/blogs error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to create blog." },
      { status: 500 }
    );
  }
}

// ─── PUT: Update Blog ───────────────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json();

    const validationErrors = validateBlogInput(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    const docId = String(body.id).trim();
    const docRef = doc(db, "blogs", docId);
    const title = String(body.title || "").trim();

    const updateData = {
      id: docId,
      title,
      slug: generateSlug(title),
      category: String(body.category || "").trim(),
      tags: Array.isArray(body.tags)
        ? body.tags.filter((t) => typeof t === "string" && t.trim() !== "")
        : [],
      featuredImage: String(body.featuredImage || "").trim(),
      readTime: String(body.readTime || "").trim(),
      author: String(body.author || "").trim(),
      status: body.status === "Published" ? "Published" : "Draft",
      content: String(body.content || "").trim(),
      excerpt: String(body.excerpt || "").trim(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Blog post updated successfully.",
        data: updateData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/blogs error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to update blog." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete Blog ────────────────────────────────────────
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
        { success: false, error: "A valid blog ID is required for deletion." },
        { status: 400 }
      );
    }

    const docId = id.trim();
    await deleteDoc(doc(db, "blogs", docId));

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Blog post deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/blogs error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Failed to delete blog." },
      { status: 500 }
    );
  }
}
