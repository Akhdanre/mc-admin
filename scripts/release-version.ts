import fs from "fs";

/**
 * Bumps semver string.
 */
function bumpVersion(current: string, type: "patch" | "minor" | "major" = "patch"): string {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: ${current}`);
  }
  let [major, minor, patch] = parts;
  if (type === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

async function main() {
  const pkgPath = "package.json";
  const changelogPath = "CHANGELOG.md";

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const oldVersion = pkg.version || "0.1.0";
  const newVersion = bumpVersion(oldVersion, "patch");
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Bumping version: ${oldVersion} -> ${newVersion}`);

  // 1. Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  // 2. Update CHANGELOG.md
  let changelog = fs.readFileSync(changelogPath, "utf-8");

  const unreleasedRegex = /## \[Unreleased\]([\s\S]*?)(## \[\d+\.\d+\.\d+\])/;
  const match = changelog.match(unreleasedRegex);

  if (match) {
    const unreleasedContent = match[1].trim();

    // If there is actual content in unreleased
    if (unreleasedContent.length > 0) {
      const releaseSection = `## [Unreleased]\n\n## [${newVersion}] - ${today}\n\n${unreleasedContent}\n\n`;
      changelog = changelog.replace(unreleasedRegex, `${releaseSection}$2`);
    } else {
      // Empty unreleased section, still add version anchor
      const releaseSection = `## [Unreleased]\n\n## [${newVersion}] - ${today}\n\n### Changed\n\n- Release version ${newVersion}.\n\n`;
      changelog = changelog.replace(unreleasedRegex, `${releaseSection}$2`);
    }

    fs.writeFileSync(changelogPath, changelog, "utf-8");
    console.log(`Updated CHANGELOG.md with release section [${newVersion}] - ${today}`);
  } else {
    console.warn("Could not find ## [Unreleased] section in CHANGELOG.md");
  }

  // Set GitHub Action output if in GHA environment
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=v${newVersion}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
