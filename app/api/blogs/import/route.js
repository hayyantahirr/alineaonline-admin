import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload a buffer to Cloudinary
async function uploadBufferToCloudinary(
  buffer,
  mimeType = "image/png",
  folder = "blogs"
) {
  return new Promise((resolve, reject) => {
    const base64Data = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    cloudinary.uploader.upload(
      dataUri,
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

function cleanFilenameTitle(filename = "") {
  return filename
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[-_]+/g, " ") // Replace underscores/hyphens with spaces
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stripHtml(html = "") {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No document file provided." },
        { status: 400 }
      );
    }

    const filename = file.name || "document.docx";
    const fileExtension = filename.split(".").pop()?.toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let htmlContent = "";
    const uploadedImages = [];

    if (fileExtension === "docx") {
      // ── Process DOCX with Mammoth ──
      const mammothOptions = {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read();
            const mimeType = image.contentType || "image/png";
            const uploadResult = await uploadBufferToCloudinary(
              imageBuffer,
              mimeType,
              "blogs"
            );
            if (uploadResult?.secure_url) {
              uploadedImages.push(uploadResult.secure_url);
              return { src: uploadResult.secure_url };
            }
          } catch (err) {
            console.error("Error uploading embedded DOCX image to Cloudinary:", err);
          }
          // Fallback to inline data URI if Cloudinary upload fails
          const imageBuffer = await image.read();
          const mimeType = image.contentType || "image/png";
          return {
            src: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
          };
        }),
      };

      const result = await mammoth.convertToHtml({ buffer }, mammothOptions);
      htmlContent = result.value || "";
    } else if (fileExtension === "pdf") {
      // ── Process Text-Extractable PDF with PDFParse ──
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const rawText = textResult?.text || "";
      await parser.destroy();

      if (!rawText.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Could not extract text from this PDF. Please ensure it is a text-based (not scanned image) PDF or upload a .docx file.",
          },
          { status: 400 }
        );
      }

      // Reconstruct semantic paragraphs and headings from PDF text
      const blocks = rawText
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);

      const htmlBlocks = blocks.map((block, idx) => {
        const isShortHeading =
          block.length < 90 &&
          !block.endsWith(".") &&
          !block.includes("?") &&
          idx > 0;

        if (isShortHeading) {
          return `<h2>${escapeHtml(block)}</h2>`;
        }
        return `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`;
      });

      htmlContent = htmlBlocks.join("\n");
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file format. Please upload a .docx (Microsoft Word) or .pdf file.",
        },
        { status: 400 }
      );
    }

    // ── Extract Metadata ──
    const plainText = stripHtml(htmlContent);

    // 1. Title Extraction
    let extractedTitle = "";
    // Check for first <h1> or <h2>
    const headingMatch = htmlContent.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i);
    if (headingMatch && headingMatch[1]) {
      extractedTitle = stripHtml(headingMatch[1]);
      // Remove first heading from body if it's the title so it doesn't duplicate
      htmlContent = htmlContent.replace(headingMatch[0], "").trim();
    }

    if (!extractedTitle || extractedTitle.length < 3) {
      extractedTitle = cleanFilenameTitle(filename);
    }

    // 2. Excerpt Extraction
    let excerpt = "";
    if (plainText) {
      excerpt =
        plainText.length > 220
          ? plainText.substring(0, 217).trim() + "..."
          : plainText;
    }

    // 3. Read Time Calculation (Avg 200 words/min)
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${readTimeMinutes} min read`;

    // 4. Featured Image
    const featuredImage = uploadedImages.length > 0 ? uploadedImages[0] : "";

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${filename} with ${uploadedImages.length} image(s) uploaded to Cloudinary.`,
      data: {
        title: extractedTitle,
        slug: generateSlug(extractedTitle),
        content: htmlContent,
        excerpt,
        readTime,
        featuredImage,
        imagesCount: uploadedImages.length,
        uploadedImages,
      },
    });
  } catch (error) {
    console.error("POST /api/blogs/import error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process document.",
      },
      { status: 500 }
    );
  }
}
