import { Card, CardContent } from "@/components/ui/card";
import { Folder, FileText, CheckCircle } from "lucide-react";

interface StructureItemProps {
  name: string;
  type: "folder" | "file";
  level: number;
}

function StructureItem({ name, type, level }: StructureItemProps) {
  const marginLeft = level * 16;
  
  return (
    <div 
      className="flex items-center space-x-2" 
      style={{ marginLeft: `${marginLeft}px` }}
      data-testid={`structure-item-${name}`}
    >
      {type === "folder" ? (
        <Folder className="w-4 h-4 text-yellow-600" />
      ) : (
        <FileText className="w-4 h-4 text-gray-600" />
      )}
      <span className="text-sm font-mono">{name}</span>
    </div>
  );
}

interface ConfigFileProps {
  name: string;
  status: "configured" | "missing";
}

function ConfigFile({ name, status: _status }: ConfigFileProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`config-file-${name}`}>
      <div className="flex items-center space-x-3">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm" data-testid={`filename-${name}`}>{name}</span>
      </div>
      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" data-testid={`status-${name}`} />
    </div>
  );
}

export default function ProjectStructure() {
  const structure = [
    { name: "fullstack-foundation/", type: "folder" as const, level: 0 },
    { name: "client/", type: "folder" as const, level: 1 },
    { name: "src/", type: "folder" as const, level: 2 },
    { name: "public/", type: "folder" as const, level: 2 },
    { name: "package.json", type: "file" as const, level: 2 },
    { name: "vite.config.ts", type: "file" as const, level: 2 },
    { name: "server/", type: "folder" as const, level: 1 },
    { name: "src/", type: "folder" as const, level: 2 },
    { name: "routes/", type: "folder" as const, level: 2 },
    { name: "package.json", type: "file" as const, level: 2 },
    { name: "tsconfig.json", type: "file" as const, level: 2 },
    { name: "shared/", type: "folder" as const, level: 1 },
    { name: "types/", type: "folder" as const, level: 2 },
    { name: "utils/", type: "folder" as const, level: 2 },
    { name: "constants/", type: "folder" as const, level: 2 },
  ];

  const configFiles = [
    { name: ".replit", status: "configured" as const },
    { name: "replit.nix", status: "configured" as const },
    { name: ".gitignore", status: "configured" as const },
    { name: "package.json", status: "configured" as const },
    { name: "tsconfig.json", status: "configured" as const },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-6" data-testid="title-project-structure">
        Project Structure
      </h2>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" data-testid="title-monorepo-structure">
                Monorepo Structure
              </h3>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm" data-testid="structure-tree">
                <div className="space-y-1">
                  {structure.map((item, index) => (
                    <StructureItem
                      key={index}
                      name={item.name}
                      type={item.type}
                      level={item.level}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4" data-testid="title-key-configuration">
                Key Configuration
              </h3>
              <div className="space-y-3">
                {configFiles.map((file) => (
                  <ConfigFile key={file.name} name={file.name} status={file.status} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
