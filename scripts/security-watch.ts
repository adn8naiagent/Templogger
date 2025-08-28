#!/usr/bin/env tsx
import chokidar from "chokidar";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

interface SecurityStatus {
  vulnerabilities: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  lastScan: string;
  packagesScanned: number;
  hasIssues: boolean;
}

class SecurityWatcher {
  private statusFile = path.join(process.cwd(), ".security-status.json");

  constructor() {
    console.log("🔒 Security watcher started");
  }

  async runSecurityScan(): Promise<SecurityStatus> {
    try {
      console.log("🔍 Running security scan...");

      // Run snyk test and capture output
      const { stdout, stderr } = await execAsync("snyk test --json", {
        cwd: process.cwd(),
      });

      const result = JSON.parse(stdout);

      const status: SecurityStatus = {
        vulnerabilities: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        lastScan: new Date().toISOString(),
        packagesScanned: result.dependencyCount || 0,
        hasIssues: false,
      };

      // Parse vulnerabilities
      if (result.vulnerabilities) {
        result.vulnerabilities.forEach((vuln: any) => {
          const severity = vuln.severity.toLowerCase();
          if (status.vulnerabilities.hasOwnProperty(severity)) {
            status.vulnerabilities[severity as keyof typeof status.vulnerabilities]++;
          }
        });
      }

      status.hasIssues = Object.values(status.vulnerabilities).some((count) => count > 0);

      // Save status to file
      await fs.writeFile(this.statusFile, JSON.stringify(status, null, 2));

      console.log(
        `✅ Security scan completed. Found ${Object.values(status.vulnerabilities).reduce((a, b) => a + b, 0)} issues`
      );

      return status;
    } catch (error: any) {
      console.error("❌ Security scan failed:", error.message);

      // Create fallback status
      const fallbackStatus: SecurityStatus = {
        vulnerabilities: { low: 0, medium: 0, high: 0, critical: 0 },
        lastScan: new Date().toISOString(),
        packagesScanned: 0,
        hasIssues: false,
      };

      await fs.writeFile(this.statusFile, JSON.stringify(fallbackStatus, null, 2));
      return fallbackStatus;
    }
  }

  async watchPackageFiles() {
    // Watch for package.json and package-lock.json changes
    const watcher = chokidar.watch(["package.json", "package-lock.json"], {
      ignored: /node_modules/,
      persistent: true,
    });

    watcher.on("change", async (filePath) => {
      console.log(`📦 Package file changed: ${filePath}`);

      // Wait a bit for the installation to complete
      setTimeout(async () => {
        await this.runSecurityScan();
      }, 5000);
    });

    // Initial scan
    await this.runSecurityScan();

    console.log("👀 Watching package files for changes...");
  }

  async getStatus(): Promise<SecurityStatus | null> {
    try {
      const statusContent = await fs.readFile(this.statusFile, "utf-8");
      return JSON.parse(statusContent);
    } catch (_) {
      return null;
    }
  }
}

// CLI execution
if (require.main === module) {
  const watcher = new SecurityWatcher();

  watcher.watchPackageFiles().catch((error) => {
    console.error("❌ Security watcher failed:", error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Security watcher stopped");
    process.exit(0);
  });
}

export { SecurityWatcher, SecurityStatus };
