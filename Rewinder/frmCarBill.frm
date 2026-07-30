VERSION 5.00
Begin VB.Form frmCarWeightMenu 
   Caption         =   "เมนูชั่งรถ"
   ClientHeight    =   3915
   ClientLeft      =   4320
   ClientTop       =   4035
   ClientWidth     =   6120
   LinkTopic       =   "Form1"
   LockControls    =   -1  'True
   ScaleHeight     =   3915
   ScaleWidth      =   6120
   Begin VB.CommandButton cmdCarIn 
      Caption         =   "ชั่งรถเข้า"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   15.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   870
      Left            =   1710
      TabIndex        =   2
      Top             =   1215
      Width           =   2625
   End
   Begin VB.CommandButton cmdCarOut 
      Caption         =   "ชั่งรถออก"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   15.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   870
      Left            =   1695
      TabIndex        =   1
      Top             =   2325
      Width           =   2625
   End
   Begin VB.CommandButton cmdExit 
      Caption         =   "&ออก"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   510
      Left            =   4920
      TabIndex        =   0
      Top             =   3240
      Width           =   990
   End
   Begin VB.Label Label2 
      BackStyle       =   0  'Transparent
      Caption         =   "ชั่งรถ"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   615
      Left            =   2415
      TabIndex        =   4
      Top             =   150
      Width           =   1080
   End
   Begin VB.Label Label1 
      Alignment       =   1  'Right Justify
      BackColor       =   &H00C00000&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   810
      Left            =   -45
      TabIndex        =   3
      Top             =   0
      Width           =   6225
   End
End
Attribute VB_Name = "frmCarWeightMenu"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub cmdCarIn_Click()
    frmCarIn.Show
    Unload frmCarWeightMenu
End Sub

Private Sub cmdCarOut_Click()
    frmCarOut.Show
    Unload frmCarWeightMenu
End Sub

Private Sub cmdExit_Click()
    frmLogin.Show
    Unload frmCarWeightMenu
End Sub
