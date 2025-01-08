import { Publication } from "./types";

interface PublicationDescriptionProps {
  publication: Publication;
}

export const PublicationDescription = ({ publication }: PublicationDescriptionProps) => {
  if (!publication) return null;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-medium mb-2">Descripción</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {publication.description || "Sin descripción"}
      </p>
    </div>
  );
};