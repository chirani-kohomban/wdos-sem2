import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";

function WorkshopCard({ workshop, isRequested, onRequest, onDelete }) {
  const { t } = useTranslation();

  const formattedDate = new Date(workshop.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 flex flex-col">
      {/* Cover Image */}
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {workshop.image ? (
          <img
            src={workshop.image}
            alt={workshop.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80";
            }}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-200 dark:bg-gray-750">
            🌱 No Image Available
          </div>
        )}
        <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {workshop.slots} {t("workshops.slots")}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">
            {workshop.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {workshop.description}
          </p>

          <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <p className="flex items-center gap-1.5">
              <span>📅</span>
              <strong>{t("workshops.date")}:</strong> {formattedDate}
            </p>
            <p className="flex items-center gap-1.5">
              <span>📍</span>
              <strong>{t("workshops.location")}:</strong> {workshop.location}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Link
            to={`/workshops/${workshop.id}`}
            className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1"
            aria-label={`View details of ${workshop.title}`}
          >
            {t("workshops.viewDetails")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRequest && onRequest(workshop.id)}
              disabled={isRequested || workshop.slots <= 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                isRequested
                  ? "bg-gray-400 dark:bg-gray-600 cursor-default"
                  : workshop.slots <= 0
                  ? "bg-red-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              aria-label={isRequested ? `Already requested ${workshop.title}` : workshop.slots <= 0 ? `${workshop.title} is fully booked` : `Request to join ${workshop.title}`}
            >
              {isRequested
                ? t("workshops.requested")
                : workshop.slots <= 0
                ? "Fully Booked"
                : t("workshops.requestJoin")}
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(workshop.id)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete ${workshop.title}`}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default WorkshopCard;
