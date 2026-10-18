/**
 * A request, from the home screen, to open the settings straight onto setting
 * up an Android phone over Wi-Fi. The settings may not be showing yet when it
 * is made, so it is kept until they are.
 */
export const SETUP_EVENT = "mirlow:android-setup";

let pending = false;

export function requestSetup() {
  pending = true;
  window.dispatchEvent(new Event(SETUP_EVENT));
}

/** True once for each request. */
export function takeSetupRequest(): boolean {
  const was = pending;
  pending = false;
  return was;
}
