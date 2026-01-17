Set WshShell = CreateObject("WScript.Shell")

' Start Backend in background
' 0 = Hide window
WshShell.Run "cmd /c cd backend && node dist/src/main.js", 0, False

' Wait for backend
WScript.Sleep 5000

' Start Frontend in background
' 0 = Hide window
WshShell.Run "cmd /c cd frontend && npm run dev", 0, False

' Notify user (Optional - can be removed for total silence)
' MsgBox "Enterprise POS Servers are now running in the background.", 64, "POS System"
