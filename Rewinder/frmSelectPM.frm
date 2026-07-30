VERSION 5.00
Begin VB.Form frmSelectPM 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Line การผลิต"
   ClientHeight    =   3420
   ClientLeft      =   5025
   ClientTop       =   3960
   ClientWidth     =   5010
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   3420
   ScaleWidth      =   5010
   Begin VB.ComboBox cbLineID 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   675
      Left            =   2115
      TabIndex        =   2
      Top             =   1305
      Width           =   2580
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
      Left            =   3735
      TabIndex        =   1
      Top             =   2475
      Width           =   1050
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
      Left            =   2385
      TabIndex        =   0
      Top             =   2475
      Width           =   1050
   End
   Begin VB.Label Label1 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "Line การผลิต"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   30
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   675
      Left            =   765
      TabIndex        =   3
      Top             =   0
      Width           =   3300
   End
   Begin VB.Label Label2 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "Line การผลิต"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   30
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H8000000E&
      Height          =   650
      Left            =   800
      TabIndex        =   4
      Top             =   30
      Width           =   3300
   End
   Begin VB.Shape Shape2 
      BackColor       =   &H80000001&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H80000001&
      Height          =   780
      Left            =   0
      Top             =   0
      Width           =   4965
   End
   Begin VB.Shape Shape1 
      BackColor       =   &H80000001&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H80000001&
      Height          =   3390
      Left            =   0
      Top             =   45
      Width           =   1680
   End
End
Attribute VB_Name = "frmSelectPM"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cbLineID_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub cmdCancel_Click()
    staffID = 0
    depID = 0
    frmLogin.Show
    Unload frmSelectPM
End Sub

Private Sub cmdOK_Click()
Dim Rs As New ADODB.Recordset
Dim Sql As String
Dim fs As New FileSystemObject
Dim txtFile As TextStream

    If Trim(cbLineID) = "" Then
        MsgBox "กรุณาเลือก Line ผลิต", vbOKOnly + vbExclamation, "Line ผลิต"
        cbLineID.SetFocus
        Exit Sub
    End If
    Sql = "select id from pl_production_line " & _
            " where production_line='" & cbLineID.Text & "' and rownum=1"
    Rs.Open Sql, conn, adOpenForwardOnly, adLockReadOnly
    
    Set txtFile = fs.CreateTextFile(App.Path & "\LineID.txt")
    txtFile.WriteLine Rs!Id
    lineID = Rs!Id
    
    txtFile.Close
    Rs.Close
    Set Rs = Nothing
    
    frmRollWaitDeclare.Show
    Unload frmSelectPM
End Sub

Private Sub Form_Load()
Dim Rs As New ADODB.Recordset
Dim Sql As String

    Sql = "select production_line from pl_production_line order by production_line"
    Rs.Open Sql, conn, adOpenForwardOnly, adLockReadOnly
    
    Do While Not Rs.EOF
        cbLineID.AddItem Rs!production_line
        Rs.MoveNext
    Loop
    
    Rs.Close
    Set Rs = Nothing
End Sub
