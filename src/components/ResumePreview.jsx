import { useEffect, useRef, useState } from "react";
import { portfolioConfig } from "../portfolio.config";

const {
  applications,
  copy: { resumePreview: resumePreviewCopy },
  resume,
} = portfolioConfig;

const MIN_RENDER_WIDTH = 240;
const MAX_PIXEL_RATIO = 2;
const MAX_RENDER_PIXELS = 12_000_000;

let pdfRuntimePromise;
const pdfDocumentCache = new Map();

function getPdfRuntime() {
  if (!pdfRuntimePromise) {
    pdfRuntimePromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ])
      .then(([pdfjs, workerAsset]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = workerAsset.default;
        return pdfjs;
      })
      .catch((error) => {
        pdfRuntimePromise = undefined;
        throw error;
      });
  }

  return pdfRuntimePromise;
}

function getPdfDocument(source) {
  const cachedDocument = pdfDocumentCache.get(source);
  if (cachedDocument) return cachedDocument;

  const documentPromise = getPdfRuntime()
    .then((pdfjs) => pdfjs.getDocument({ url: source }).promise)
    .catch((error) => {
      if (pdfDocumentCache.get(source) === documentPromise) {
        pdfDocumentCache.delete(source);
      }
      throw error;
    });

  pdfDocumentCache.set(source, documentPromise);
  return documentPromise;
}

export function preloadResumePreview(source) {
  return getPdfDocument(source).then(() => undefined);
}

export default function ResumePreview({
  source,
  onOpenBrowser,
  zoom = 1,
}) {
  const viewportRef = useRef(null);
  const pagesRef = useRef(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    let animationFrame;
    const measure = () => {
      const width = Math.floor(viewport.clientWidth);
      if (width < MIN_RENDER_WIDTH) return;
      setPreviewWidth((current) =>
        Math.abs(current - width) < 2 ? current : width,
      );
    };
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", scheduleMeasure);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", scheduleMeasure);
      };
    }

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(viewport);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const viewportElement = viewportRef.current;
    const pagesElement = pagesRef.current;
    if (
      !viewportElement ||
      !pagesElement ||
      previewWidth < MIN_RENDER_WIDTH
    ) {
      return undefined;
    }

    let active = true;
    let scrollFrame;
    const renderTasks = new Set();
    const hasRenderedPage = pagesElement.childElementCount > 0;

    setStatus(hasRenderedPage ? "updating" : "loading");

    const renderDocument = async () => {
      try {
        const pdfDocument = await getPdfDocument(source);
        if (!active) return;

        const previousScroll = hasRenderedPage
          ? {
              x:
                (viewportElement.scrollLeft +
                  viewportElement.clientWidth / 2) /
                Math.max(viewportElement.scrollWidth, 1),
              y:
                (viewportElement.scrollTop +
                  viewportElement.clientHeight / 2) /
                Math.max(viewportElement.scrollHeight, 1),
            }
          : null;
        const availableWidth = Math.max(
          previewWidth - 28,
          MIN_RENDER_WIDTH,
        );
        const pageFragment = window.document.createDocumentFragment();

        for (
          let pageNumber = 1;
          pageNumber <= pdfDocument.numPages;
          pageNumber += 1
        ) {
          const page = await pdfDocument.getPage(pageNumber);
          if (!active) return;

          const naturalViewport = page.getViewport({ scale: 1 });
          const fitScale = availableWidth / naturalViewport.width;
          const pageViewport = page.getViewport({
            scale: fitScale * zoom,
          });
          const pageArea = Math.max(
            pageViewport.width * pageViewport.height,
            1,
          );
          const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            MAX_PIXEL_RATIO,
            Math.sqrt(MAX_RENDER_PIXELS / pageArea),
          );
          const canvas = window.document.createElement("canvas");

          canvas.className = "salah-pdf-page";
          canvas.width = Math.ceil(pageViewport.width * pixelRatio);
          canvas.height = Math.ceil(pageViewport.height * pixelRatio);
          canvas.style.width = `${Math.floor(pageViewport.width)}px`;
          canvas.style.height = `${Math.floor(pageViewport.height)}px`;
          canvas.setAttribute(
            "aria-label",
            `${applications.resume.label} page ${pageNumber} of ${pdfDocument.numPages}`,
          );
          canvas.setAttribute("role", "img");

          const renderTask = page.render({
            canvas,
            viewport: pageViewport,
            transform:
              pixelRatio === 1
                ? undefined
                : [pixelRatio, 0, 0, pixelRatio, 0, 0],
            background: "#ffffff",
          });
          renderTasks.add(renderTask);
          await renderTask.promise;
          renderTasks.delete(renderTask);
          pageFragment.append(canvas);
        }

        if (!active) return;

        pagesElement.replaceChildren(pageFragment);
        setStatus("ready");

        if (previousScroll) {
          scrollFrame = window.requestAnimationFrame(() => {
            viewportElement.scrollLeft =
              previousScroll.x * viewportElement.scrollWidth -
              viewportElement.clientWidth / 2;
            viewportElement.scrollTop =
              previousScroll.y * viewportElement.scrollHeight -
              viewportElement.clientHeight / 2;
          });
        }
      } catch (error) {
        if (
          !active ||
          error?.name === "RenderingCancelledException" ||
          error?.name === "AbortException"
        ) {
          return;
        }

        setStatus(hasRenderedPage ? "ready" : "error");
      }
    };

    renderDocument();

    return () => {
      active = false;
      window.cancelAnimationFrame(scrollFrame);
      renderTasks.forEach((task) => task.cancel());
    };
  }, [previewWidth, source, zoom]);

  return (
    <div ref={viewportRef} className="salah-pdf-preview">
      <div
        ref={pagesRef}
        className="salah-pdf-pages"
        aria-busy={status === "loading" || status === "updating"}
        aria-label={`${applications.resume.label} preview`}
      />

      {status === "loading" && (
        <div className="salah-document-loading" role="status">
          <span aria-hidden="true" />
          {resumePreviewCopy.loadingPrefix} {resume.displayName}…
        </div>
      )}

      {status === "error" && (
        <div className="salah-document-fallback" role="alert">
          <p>{resumePreviewCopy.error}</p>
          <button type="button" onClick={onOpenBrowser}>
            {resumePreviewCopy.openInBrowser}
          </button>
        </div>
      )}
    </div>
  );
}
