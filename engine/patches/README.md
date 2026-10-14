# Mirlow patches to UxPlay

Mirlow builds UxPlay from the commit recorded in `../UXPLAY_COMMIT`, with the
patches in this folder applied in order. They are the complete set of changes
Mirlow makes to UxPlay, and are licensed, like UxPlay itself, under GPL-3.0.

| Patch | What it does |
| --- | --- |
| `0001-mirlow-supervisor-events.patch` | When the environment variable `MIRLOW_SUPERVISED` is set, UxPlay prints one machine-readable line (`@@mirlow <event> …`) for each state change the desktop app cares about, and shuts down cleanly when its standard input closes. Without the variable, behaviour is unchanged. |
| `0002-windows-do-not-link-wsock32.patch` | Stops linking the legacy `wsock32` library on Windows. See below. |
| `0003-windows-fix-udp-recvfrom-address-length.patch` | Passes the right address-length pointer to `recvfrom`. Without it there is no sound on Windows. See below. |

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

## Why 0003 exists

When a network adapter does not timestamp received packets (the default for
most Wi-Fi adapters on Windows), UxPlay 1.74 reads its UDP sockets through a
fallback `recvfrom` call. That call passed `&addrlen`, the address of the
pointer parameter, where it should have passed `addrlen`. With no source
address wanted, Winsock was handed a length of zero and rejected every read
with `WSAEFAULT`, leaving the datagram queued, so `select` reported the socket
readable again at once. The audio thread spun on that forever and never
decoded a packet: the picture (sent over TCP) worked, the sound (sent over
UDP) did not, and the NTP clock exchange timed out. Passing `addrlen` itself
is the whole fix, and is worth offering upstream.
