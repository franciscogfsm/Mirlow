# Mirlow patches to UxPlay

Mirlow builds UxPlay from the commit recorded in `../UXPLAY_COMMIT`, with the
patches in this folder applied in order. They are the complete set of changes
Mirlow makes to UxPlay, and are licensed, like UxPlay itself, under GPL-3.0.

| Patch | What it does |
| --- | --- |
| `0001-mirlow-supervisor-events.patch` | When the environment variable `MIRLOW_SUPERVISED` is set, UxPlay prints one machine-readable line (`@@mirlow <event> …`) for each state change the desktop app cares about, and shuts down cleanly when its standard input closes. Without the variable, behaviour is unchanged. |
| `0002-windows-do-not-link-wsock32.patch` | Stops linking the legacy `wsock32` library on Windows. See below. |

## Why 0002 exists

UxPlay 1.74's built-in mDNS responder selects the network interface for its
announcements with `setsockopt(IP_MULTICAST_IF)`. The Windows build linked
`wsock32` ahead of `ws2_32`, so that call resolved to the Winsock 1 wrapper,
which renumbers IP-level options: Winsock 2's `IP_MULTICAST_IF` (9) is
Winsock 1's `IP_DONTFRAGMENT`. The interface was therefore never set, and
Windows sent the announcements out of whichever adapter had the best route
metric. On a PC that also has a virtual adapter (WSL, Hyper-V, a VPN) that is
often not the Wi-Fi adapter, and no iPhone ever sees the receiver.

Everything UxPlay uses is in `ws2_32`, so dropping `wsock32` is the whole fix.
