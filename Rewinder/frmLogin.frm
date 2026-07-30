VERSION 5.00
Begin VB.Form frmLogin 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Login"
   ClientHeight    =   3195
   ClientLeft      =   4800
   ClientTop       =   4170
   ClientWidth     =   5715
   LinkTopic       =   "Form1"
   LockControls    =   -1  'True
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   3195
   ScaleWidth      =   5715
   Begin VB.PictureBox picLogo 
      BorderStyle     =   0  'None
      Height          =   3165
      Left            =   0
      Picture         =   "frmLogin.frx":0000
      ScaleHeight     =   3165
      ScaleWidth      =   2025
      TabIndex        =   6
      Top             =   0
      Width           =   2025
      Begin VB.Label Label4 
         Alignment       =   2  'Center
         BackColor       =   &H8000000D&
         Caption         =   "AKPC"
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   26.25
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H8000000E&
         Height          =   600
         Left            =   0
         TabIndex        =   8
         Top             =   2565
         Width           =   1800
      End
   End
   Begin VB.CommandButton cmdCancel 
      Caption         =   "&ยกเลิก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   510
      Left            =   4320
      TabIndex        =   5
      Top             =   2370
      Width           =   1125
   End
   Begin VB.CommandButton cmdOK 
      Caption         =   "&ตกลง"
      Default         =   -1  'True
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   510
      Left            =   3015
      TabIndex        =   4
      Top             =   2385
      Width           =   1125
   End
   Begin VB.TextBox txtPasswd 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   420
      IMEMode         =   3  'DISABLE
      Left            =   3480
      PasswordChar    =   "*"
      TabIndex        =   1
      Top             =   1590
      Width           =   1965
   End
   Begin VB.TextBox txtUserName 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   420
      Left            =   3480
      TabIndex        =   0
      Top             =   1065
      Width           =   1965
   End
   Begin VB.Label Label3 
      BackStyle       =   0  'Transparent
      Caption         =   "เข้าสู่ระบบ"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   27.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   735
      Left            =   2430
      TabIndex        =   7
      Top             =   45
      Width           =   2580
   End
   Begin VB.Label Label2 
      Caption         =   "Password"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   285
      Left            =   2025
      TabIndex        =   3
      Top             =   1650
      Width           =   1380
   End
   Begin VB.Label Label1 
      Caption         =   "User Name"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   285
      Left            =   2025
      TabIndex        =   2
      Top             =   1140
      Width           =   1380
   End
End
Attribute VB_Name = "frmLogin"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cmdCancel_Click()
    End
End Sub

Private Sub cmdOK_Click()
Dim Sql As String
Dim Rs As New ADODB.Recordset
Dim fs As New FileSystemObject
Dim txtFile As TextStream

    If Trim(txtUserName) = "" Then
        MsgBox "กรุณาระบุชื่อเข้าระบบ", vbOKOnly + vbExclamation, "Login"
        Call txtFocus(txtUserName)
        Exit Sub
    End If

    If Trim(txtPasswd) = "" Then
        MsgBox "กรุณาระบุรหัสผ่าน", vbOKOnly + vbExclamation, "Login"
        Call txtFocus(txtPasswd)
        Exit Sub
    End If
    
    Sql = "SELECT s.id, s.department_id "
    Sql = Sql + " From STAFF s "
    Sql = Sql + " WHERE s.user_name='" & Trim(txtUserName) & "'  AND s.passwd='" & Trim(txtPasswd) & "'"
    
    Rs.Open Sql, conn
    
    If Rs.BOF = True And Rs.EOF = True Then
        MsgBox "ชื่อเข้าระบบหรือรหัสผ่านไม่ถูกต้อง", vbOKOnly + vbExclamation, "Login"
        Call txtFocus(txtPasswd)
        Exit Sub
    Else
        staffID = Rs!Id
        depID = Rs!department_id
        
        If frmID = 1 Then            'ถ้าเป็นหน้า Rewinder
            If chkPermission(staffID, depID, 231) = True Then   'permission_id 231 คือสิทธิ์การใช้งานระบบ Production
                If fs.FileExists(App.Path & "\LineID.txt") = True Then
                    Set txtFile = fs.OpenTextFile(App.Path & "\LineID.txt")
                    lineID = CInt(txtFile.ReadLine)
                    txtFile.Close
                    
                    frmRollWaitDeclare.Show

                Else
                    frmSelectPM.Show
                End If
                
                Unload frmLogin
            Else
                MsgBox "คุณไม่ได้รับสิทธิ์การใช้งาน", vbOKOnly + vbInformation, "Login"
            End If

        ElseIf frmID = 2 Then          'ถ้าเป็นหน้าตาชั่ง

            If chkPermission(staffID, depID, 702) = True Then   'permission_id 702 คือสิทธิ์ในการใช้งานระบบตาชั่ง
                If fs.FileExists(App.Path & "\WeightID.txt") = True Then
                    Set txtFile = fs.OpenTextFile(App.Path & "\WeightID.txt")
                    WeightID = CInt(txtFile.ReadLine)
                    txtFile.Close
                    frmCarWeightMenu.Show
                Else
                    frmSelectWE.Show
                End If

                Unload frmLogin
            Else
                MsgBox "คุณไม่ได้รับสิทธิ์การใช้งาน", vbOKOnly + vbInformation, "Login"
            End If

        End If
    End If
    Rs.Close
    Set Rs = Nothing
End Sub



Private Sub txtUserName_KeyPress(KeyAscii As Integer)
If KeyAscii = 13 Then
    txtPasswd.SetFocus
End If
End Sub

Private Sub txtUserName_LostFocus()
    txtUserName = UCase(txtUserName)
End Sub
