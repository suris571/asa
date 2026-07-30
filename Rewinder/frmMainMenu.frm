VERSION 5.00
Begin VB.Form frmMainMenu 
   BorderStyle     =   1  'Fixed Single
   ClientHeight    =   4755
   ClientLeft      =   3600
   ClientTop       =   3150
   ClientWidth     =   6000
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   4755
   ScaleWidth      =   6000
   Begin VB.CommandButton cmdClose 
      Caption         =   "ปิด"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   450
      Left            =   4800
      TabIndex        =   3
      Top             =   4200
      Width           =   1005
   End
   Begin VB.CommandButton cmdWeight 
      Caption         =   "&ตาชั่ง"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   15.75
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   630
      Left            =   1590
      TabIndex        =   2
      Top             =   2745
      Width           =   2625
   End
   Begin VB.CommandButton cmdRewinder 
      Caption         =   "&Rewinder"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   630
      Left            =   1590
      TabIndex        =   1
      Top             =   1455
      Width           =   2625
   End
   Begin VB.Label Label1 
      Alignment       =   1  'Right Justify
      BackColor       =   &H00ECE4DB&
      Caption         =   "เมนูหลัก    "
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   26.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   -1  'True
         Strikethrough   =   0   'False
      EndProperty
      Height          =   840
      Left            =   0
      TabIndex        =   0
      Top             =   0
      Width           =   6225
   End
End
Attribute VB_Name = "frmMainMenu"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub cmdClose_Click()
    End
End Sub

Private Sub cmdRewinder_Click()
    frmID = 1        'เมนู Rewinder
    Call closeMenu
End Sub

Private Sub cmdWeight_Click()
    frmID = 2        'เมนูตาชั่ง
    Call closeMenu
End Sub

Private Sub closeMenu()
    frmLogin.Show
    Unload frmMainMenu
End Sub


