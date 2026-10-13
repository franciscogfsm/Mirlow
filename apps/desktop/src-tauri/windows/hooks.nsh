; Installer hooks for Mirlow.
;
; An iPhone can only find this PC if Windows Firewall lets the AirPlay engine
; receive connections. Without a rule, Windows shows a prompt the first time
; the engine runs, and dismissing that prompt silently blocks it for good. The
; installer already runs with administrator rights, so it adds the rule itself
; and the app works on first launch.

!macro NSIS_HOOK_POSTINSTALL
  ; Clear any earlier rules for this path first: a leftover "block" rule would
  ; take priority over the "allow" rule added below.
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\engine\bin\mirlow-engine.exe"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall add rule name="Mirlow" dir=in action=allow program="$INSTDIR\engine\bin\mirlow-engine.exe" enable=yes profile=any description="Lets your iPhone or iPad find and mirror to this PC with Mirlow."'
  Pop $0
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Mirlow"'
  Pop $0
  nsExec::Exec 'netsh advfirewall firewall delete rule name=all program="$INSTDIR\engine\bin\mirlow-engine.exe"'
  Pop $0
!macroend
