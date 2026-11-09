/**
 * Where Mirlow lives on the internet. Change these in one place if the
 * repository or site moves.
 */
const repository = "https://github.com/franciscogfsm/mirlow";

export const links = {
  repository,
  releases: `${repository}/releases`,
  /** Always resolves to the installer attached to the newest release. */
  download: `${repository}/releases/latest/download/Mirlow-Setup-x64.exe`,
  licenses: `${repository}/blob/main/THIRD-PARTY-NOTICES.md`,
  issues: `${repository}/issues`,
  /** The page to share: friendlier to people who don't use GitHub. */
  website: "https://mirlow.vercel.app",
  star: `${repository}/stargazers`,
  community: `${repository}/discussions`,
  /** GitHub's default discussion categories, opened straight on a new post. */
  ask: `${repository}/discussions/new?category=q-a`,
  idea: `${repository}/discussions/new?category=ideas`,
  bug: `${repository}/issues/new?template=bug.yml`,
  /** Release notes of one version, e.g. changes("1.10.0"). */
  changes: (version: string) => `${repository}/releases/tag/v${version}`,
  /** Where people write to with problems and requests. Shown publicly on the site. */
  email: "francisco.soares.martins@tecnico.ulisboa.pt",
  uxplay: "https://github.com/FDH2/UxPlay",
} as const;
