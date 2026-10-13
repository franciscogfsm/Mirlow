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
  /** Where people write to with problems and requests. Shown publicly on the site. */
  email: "francisco.soares.martins@tecnico.ulisboa.pt",
  uxplay: "https://github.com/FDH2/UxPlay",
} as const;
