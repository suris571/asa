VERSION 5.00
Begin VB.Form frmSelectWE 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "ตาชั่งรถ"
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
      Left            =   2370
      TabIndex        =   0
      Top             =   2475
      Width           =   1050
   End
   Begin VB.Label Label1 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "เลือกตาชั่งรถ"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   30
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   720
      Left            =   780
      TabIndex        =   3
      Top             =   30
      Width           =   3225
   End
   Begin VB.Label Label2 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "เลือกตาชั่งรถ"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   30
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   720
      Left            =   795
      TabIndex        =   4
      Top             =   30
      Width           =   3225
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
Attribute VB_Name = "frmSelectWE"
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
Dim fs As New FileSystemObject
Dim txtFile As TextStream

    If Trim(cbLineID) = "" Then
        MsgBox "กรุณาเลือก Line ผลิต", vbOKOnly + vbExclamation, "Line ผลิต"
        cbLineID.SetFocus
        Exit Sub
    End If
    
    Set txtFile = fs.CreateTextFile(App.Path & "\WeightID.txt")
    If cbLineID = "ตาชั่งรถ 1" Then
        txtFile.WriteLine "1"
    Else
        txtFile.WriteLine "2"
    End If
    frmCarWeightMenu.Show
    txtFile.Close
    
    Unload frmSelectWE
End Sub

Private Sub Form_Load()
        cbLineID.Clear
        
        cbLineID.AddItem "ตาชั่งรถ 1"
        cbLineID.AddItem "ตาชั่งรถ 2"
End Sub

