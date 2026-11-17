import { useEffect } from "react";

const SITE_NAME = "Nhà Hàng Dê Hương Sơn";
const SITE_LOCATION = "Hà Nội";
const BASE_URL = "https://dehuongson.vercel.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "Nhà Hàng Dê Hương Sơn tại Đường Vũ Lăng, Thanh Trì, Hà Nội chuyên phục vụ đặc sản dê núi tươi ngon, đậm đà bản sắc. Đặt bàn trực tuyến, gọi món nhanh chóng.";

/**
 * SEO component for managing head metadata dynamically in React 19 SPA
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noindex = false,
  schema = null,
}) {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME} - ${SITE_LOCATION}`
      : `${SITE_NAME} | Đặc Sản Dê Núi Hương Sơn - ${SITE_LOCATION}`;
    document.title = formattedTitle;

    // Helper: update or create meta tag
    const updateMeta = (attributeName, attributeValue, contentValue) => {
      let meta = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", contentValue);
    };

    // 2. Standard Meta Tags
    updateMeta("name", "description", description);
    updateMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
    );

    // 3. Open Graph Tags
    const currentUrl = canonical
      ? canonical.startsWith("http")
        ? canonical
        : `${BASE_URL}${canonical}`
      : window.location.href.split("?")[0].split("#")[0];

    updateMeta("property", "og:title", formattedTitle);
    updateMeta("property", "og:description", description);
    updateMeta("property", "og:type", ogType);
    updateMeta("property", "og:url", currentUrl);
    updateMeta("property", "og:image", ogImage);
    updateMeta("property", "og:site_name", SITE_NAME);
    updateMeta("property", "og:locale", "vi_VN");

    // 4. Twitter Card Tags
    updateMeta("name", "twitter:card", "summary_large_image");
    updateMeta("name", "twitter:title", formattedTitle);
    updateMeta("name", "twitter:description", description);
    updateMeta("name", "twitter:image", ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", currentUrl);

    // 6. Structured Data (Schema.org JSON-LD)
    let schemaScript = document.getElementById("seo-schema-script");
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = "seo-schema-script";
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [title, description, canonical, ogImage, ogType, noindex, schema]);

  return null;
}

