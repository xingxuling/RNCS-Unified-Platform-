Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")

Set Shortcut = WshShell.CreateShortcut(strDesktop & "\RAG-System.lnk")
Shortcut.TargetPath = "C:\Users\User\auto-rag-system\启动RAG系统.bat"
Shortcut.WorkingDirectory = "C:\Users\User\auto-rag-system"
Shortcut.Save

Set Shortcut2 = WshShell.CreateShortcut(strDesktop & "\RAG-System-Full.lnk")
Shortcut2.TargetPath = "C:\Users\User\auto-rag-system\RAG_Windows_Launcher.bat"
Shortcut2.WorkingDirectory = "C:\Users\User\auto-rag-system"
Shortcut2.Save

MsgBox "Desktop shortcuts created!"