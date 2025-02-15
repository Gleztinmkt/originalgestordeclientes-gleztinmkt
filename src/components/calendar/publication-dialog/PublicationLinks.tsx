
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface PublicationLinksProps {
  links: Array<{ label: string; url: string }>;
  onLinksChange: (links: Array<{ label: string; url: string }>) => void;
  isDesigner: boolean;
}

export const PublicationLinks = ({ links, onLinksChange, isDesigner }: PublicationLinksProps) => {
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      onLinksChange([...links, {
        label: newLinkLabel,
        url: newLinkUrl
      }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    onLinksChange(newLinks);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">Links</Label>
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-4">
          {!isDesigner && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input 
                  placeholder="Etiqueta" 
                  value={newLinkLabel} 
                  onChange={e => setNewLinkLabel(e.target.value)}
                  className="text-sm sm:text-base" 
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="URL" 
                  value={newLinkUrl} 
                  onChange={e => setNewLinkUrl(e.target.value)}
                  className="text-sm sm:text-base" 
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddLink}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <ScrollArea className="h-[100px]">
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm">
                  {!isDesigner && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLink(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <span className="flex-1 truncate">{link.label}</span>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
