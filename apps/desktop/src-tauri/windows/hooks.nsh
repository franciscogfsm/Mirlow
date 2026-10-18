; Installer hooks for Mirlow.
;
; An iPhone can only find this PC if Windows Firewall lets the AirPlay engine
; receive connections. Without a rule, Windows shows a prompt the first time
; the engine runs, and dismissing that prompt silently blocks it for good. The
; installer already runs with administrator rights, so it adds the rule itself
; and the app works on first launch. For the same reason it also sets up what
; Android phones need.

!macro NSIS_HOOK_POSTINSTALL
  ; Clear any earlier rules for this path first: a leftover "block" rule would
  ; take priority over the "allow" rule added below.
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\engine\bin\mirlow-engine.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall add rule name="Mirlow" dir=in action=allow program="$INSTDIR\engine\bin\mirlow-engine.exe" enable=yes profile=any description="Lets your iPhone or iPad find and mirror to this PC with Mirlow."'
  Pop $0
  ; The app itself receives Android phones over Miracast. That link is a
  ; Wi-Fi Direct network, which Windows treats as Public, so it needs its own rule.
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\${MAINBINARYNAME}.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall add rule name="Mirlow" dir=in action=allow program="$INSTDIR\${MAINBINARYNAME}.exe" enable=yes profile=any description="Lets your Android phone mirror to this PC with Mirlow."'
  Pop $0
  ; Android phones paired for mirroring over Wi-Fi announce themselves on the
  ; network; adb, which finds them, has to hear those announcements.
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\scrcpy\adb.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall add rule name="Mirlow" dir=in action=allow program="$INSTDIR\scrcpy\adb.exe" enable=yes profile=any description="Lets Mirlow find your Android phone for mirroring over Wi-Fi."'
  Pop $0
  ; Android phones need Windows' Wireless Display feature, which is not
  ; installed by default. It comes from Windows Update and can take minutes,
  ; so it installs in the background and the installer does not wait. Mirlow
  ; notices when it is done; if it fails, Mirlow offers to try again.
  ; The installer is 32-bit, and a 32-bit DISM cannot service 64-bit Windows.
  ${If} ${FileExists} "$WINDIR\Sysnative\dism.exe"
    StrCpy $0 "$WINDIR\Sysnative\dism.exe"
  ${Else}
    StrCpy $0 "$SYSDIR\dism.exe"
  ${EndIf}
  ExecShell "open" "$0" "/Online /Add-Capability /CapabilityName:App.WirelessDisplay.Connect~~~~0.0.1.0 /NoRestart /Quiet" SW_HIDE
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Mirlow"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\engine\bin\mirlow-engine.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\${MAINBINARYNAME}.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\scrcpy\adb.exe"'
  Pop $0
!macroend
