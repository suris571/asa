VERSION 5.00
Object = "{648A5603-2C6E-101B-82B6-000000000014}#1.1#0"; "MSCOMM32.OCX"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form frmPdRoll 
   BackColor       =   &H80000005&
   ClientHeight    =   10740
   ClientLeft      =   270
   ClientTop       =   555
   ClientWidth     =   15240
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   10740
   ScaleWidth      =   15240
   Visible         =   0   'False
   WindowState     =   2  'Maximized
   Begin VB.Frame Frame3 
      BackColor       =   &H8000000D&
      Caption         =   "3 รับน้ำหนัก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   4185
      Left            =   30
      TabIndex        =   44
      Top             =   6495
      Width           =   8445
      Begin VB.CommandButton cmdPrint2 
         Caption         =   "พิมพ์&ข้างลูก"
         Enabled         =   0   'False
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   885
         Left            =   4545
         TabIndex        =   52
         Top             =   2520
         Width           =   3030
      End
      Begin VB.CommandButton cmdSave 
         Caption         =   "&บันทึก"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   885
         Left            =   990
         TabIndex        =   51
         Top             =   2520
         Width           =   3030
      End
      Begin VB.Timer Timer2 
         Enabled         =   0   'False
         Interval        =   200
         Left            =   6285
         Top             =   1800
      End
      Begin VB.Timer Timer1 
         Interval        =   350
         Left            =   7530
         Top             =   1650
      End
      Begin MSCommLib.MSComm MSComm2 
         Left            =   6795
         Top             =   1725
         _ExtentX        =   1005
         _ExtentY        =   1005
         _Version        =   393216
         CommPort        =   2
         DTREnable       =   -1  'True
         OutBufferSize   =   4096
         BaudRate        =   110
      End
      Begin VB.TextBox txtRollID 
         Height          =   495
         Left            =   2340
         TabIndex        =   45
         Top             =   660
         Visible         =   0   'False
         Width           =   855
      End
      Begin MSCommLib.MSComm MSComm1 
         Left            =   3750
         Top             =   1020
         _ExtentX        =   1005
         _ExtentY        =   1005
         _Version        =   393216
         DTREnable       =   -1  'True
         Handshaking     =   1
         BaudRate        =   2400
         ParitySetting   =   2
         DataBits        =   7
      End
      Begin VB.TextBox txtWeight 
         Alignment       =   2  'Center
         BackColor       =   &H80000000&
         Enabled         =   0   'False
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   36
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   885
         Left            =   2145
         TabIndex        =   47
         Top             =   840
         Width           =   2895
      End
      Begin VB.CommandButton cmdGetWeight 
         Caption         =   "&รับน้ำหนัก"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   885
         Left            =   6120
         TabIndex        =   46
         Top             =   885
         Width           =   2130
      End
      Begin VB.Shape Shape6 
         BackColor       =   &H8000000D&
         BackStyle       =   1  'Opaque
         Height          =   1500
         Left            =   315
         Top             =   2190
         Width           =   7890
      End
      Begin VB.Label Label19 
         Alignment       =   1  'Right Justify
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "น้ำหนัก :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   24
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00000040&
         Height          =   555
         Left            =   315
         TabIndex        =   49
         Top             =   1035
         Width           =   1680
      End
      Begin VB.Label Label20 
         Alignment       =   1  'Right Justify
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Kg."
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   24
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00000040&
         Height          =   555
         Left            =   5160
         TabIndex        =   48
         Top             =   1020
         Width           =   780
      End
      Begin VB.Shape Shape4 
         BackColor       =   &H00F1DF89&
         BackStyle       =   1  'Opaque
         BorderColor     =   &H00F1DF89&
         Height          =   1545
         Left            =   150
         Top             =   495
         Width           =   8190
      End
      Begin VB.Shape Shape5 
         BackColor       =   &H00F1DF89&
         BackStyle       =   1  'Opaque
         BorderColor     =   &H00F1DF89&
         Height          =   2025
         Left            =   150
         Top             =   2040
         Width           =   8190
      End
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H8000000D&
      Caption         =   "รายการลูกม้วน"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   4185
      Left            =   8625
      TabIndex        =   38
      Top             =   6495
      Width           =   6555
      Begin VB.CommandButton cmdPrint 
         Caption         =   "พิ&มพ์ข้างลูก"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   480
         Left            =   5115
         TabIndex        =   50
         Top             =   570
         Width           =   1350
      End
      Begin VB.TextBox txtRollListNo 
         Alignment       =   2  'Center
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   495
         Left            =   1320
         TabIndex        =   40
         Top             =   570
         Width           =   2550
      End
      Begin VB.CommandButton cmdReprint 
         Caption         =   "&พิมพ์ซ้ำ"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   480
         Left            =   3885
         TabIndex        =   39
         Top             =   570
         Width           =   1200
      End
      Begin MSComctlLib.ListView lstRollList 
         Height          =   2895
         Left            =   180
         TabIndex        =   41
         Top             =   1155
         Width           =   6285
         _ExtentX        =   11086
         _ExtentY        =   5106
         LabelWrap       =   -1  'True
         HideSelection   =   -1  'True
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         HotTracking     =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         NumItems        =   0
      End
      Begin VB.Label Label22 
         BackStyle       =   0  'Transparent
         Caption         =   "Roll No :"
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   315
         Left            =   255
         TabIndex        =   42
         Top             =   675
         Width           =   1110
      End
      Begin VB.Label Label21 
         BackColor       =   &H00F1DF89&
         Height          =   570
         Left            =   210
         TabIndex        =   43
         Top             =   525
         Width           =   6255
      End
   End
   Begin VB.ComboBox cbHoldCause 
      Enabled         =   0   'False
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   9495
      TabIndex        =   6
      Top             =   4860
      Width           =   5475
   End
   Begin VB.TextBox txtDatePart 
      Alignment       =   2  'Center
      BackColor       =   &H80000004&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   1890
      TabIndex        =   19
      Top             =   2670
      Width           =   2910
   End
   Begin VB.TextBox txtOrderNo 
      Alignment       =   2  'Center
      BackColor       =   &H80000004&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   630
      Left            =   1890
      TabIndex        =   18
      Top             =   3375
      Width           =   4290
   End
   Begin VB.TextBox txtProdLine 
      Alignment       =   2  'Center
      BackColor       =   &H80000004&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   1890
      TabIndex        =   17
      Top             =   4185
      Width           =   2760
   End
   Begin VB.TextBox txtReelNo 
      Alignment       =   2  'Center
      BackColor       =   &H80000004&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   1890
      TabIndex        =   16
      Top             =   4905
      Width           =   2760
   End
   Begin VB.CommandButton cmdReelLov 
      Caption         =   "..."
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   4725
      TabIndex        =   15
      Top             =   4905
      Width           =   750
   End
   Begin VB.CommandButton cmdCloseReel 
      Caption         =   "&ปิด Reel"
      Enabled         =   0   'False
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   4725
      TabIndex        =   14
      Top             =   5670
      Width           =   1245
   End
   Begin VB.TextBox txtGrade 
      Alignment       =   2  'Center
      BackColor       =   &H80000000&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   7875
      TabIndex        =   13
      Top             =   2025
      Width           =   2760
   End
   Begin VB.CommandButton cmdGradeLov 
      Caption         =   "..."
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   10665
      TabIndex        =   12
      Top             =   2025
      Visible         =   0   'False
      Width           =   750
   End
   Begin VB.TextBox txtModel 
      Alignment       =   2  'Center
      BackColor       =   &H80000000&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   7875
      TabIndex        =   11
      Top             =   2790
      Width           =   2760
   End
   Begin VB.TextBox txtSize 
      Alignment       =   2  'Center
      BackColor       =   &H80000000&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   7875
      TabIndex        =   10
      Top             =   3555
      Width           =   2760
   End
   Begin VB.Frame fraStatus 
      BackColor       =   &H00F1DF89&
      BorderStyle     =   0  'None
      Height          =   1230
      Left            =   7875
      TabIndex        =   7
      Top             =   4140
      Width           =   2760
      Begin VB.OptionButton optPass 
         BackColor       =   &H00F1DF89&
         Caption         =   "Pass"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   555
         Left            =   180
         TabIndex        =   9
         Top             =   135
         Value           =   -1  'True
         Width           =   1500
      End
      Begin VB.OptionButton optHold 
         BackColor       =   &H00F1DF89&
         Caption         =   "Hold"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   555
         Left            =   180
         TabIndex        =   8
         Top             =   720
         Width           =   1500
      End
   End
   Begin VB.Frame Frame1 
      BorderStyle     =   0  'None
      Height          =   2475
      Left            =   11475
      TabIndex        =   1
      Top             =   2040
      Width           =   3540
      Begin VB.TextBox txtDiameter 
         Alignment       =   2  'Center
         BackColor       =   &H00FFFFFF&
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   555
         Left            =   90
         TabIndex        =   3
         Top             =   420
         Width           =   3390
      End
      Begin VB.TextBox txtRollNo 
         Alignment       =   2  'Center
         BackColor       =   &H8000000D&
         BorderStyle     =   0  'None
         Enabled         =   0   'False
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   26.25
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   675
         Left            =   75
         TabIndex        =   2
         Top             =   1695
         Width           =   3405
      End
      Begin VB.Label Label15 
         Alignment       =   2  'Center
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Diameter"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00000040&
         Height          =   300
         Left            =   1035
         TabIndex        =   5
         Top             =   150
         Width           =   1110
      End
      Begin VB.Label Label16 
         Alignment       =   2  'Center
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Roll No"
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   21.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   525
         Left            =   960
         TabIndex        =   4
         Top             =   1125
         Width           =   1590
      End
   End
   Begin VB.ComboBox cbRemarks 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   8010
      TabIndex        =   0
      Top             =   5640
      Width           =   6960
   End
   Begin MSMask.MaskEdBox txtProdDate 
      Height          =   525
      Left            =   1890
      TabIndex        =   20
      Top             =   1950
      Width           =   2910
      _ExtentX        =   5133
      _ExtentY        =   926
      _Version        =   393216
      BackColor       =   -2147483644
      MaxLength       =   16
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Mask            =   "##/##/#### ##:##"
      PromptChar      =   "_"
   End
   Begin VB.Label Label2 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "ข้อมูลลูกม้วนกระดาษ"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H8000000F&
      Height          =   555
      Left            =   465
      TabIndex        =   37
      Top             =   165
      Width           =   3930
   End
   Begin VB.Label Label1 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "ข้อมูลลูกม้วนกระดาษ"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H8000000E&
      Height          =   555
      Left            =   435
      TabIndex        =   36
      Top             =   135
      Width           =   3930
   End
   Begin VB.Label Label3 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "วันที่ :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   1080
      TabIndex        =   35
      Top             =   2025
      Width           =   720
   End
   Begin VB.Label Label4 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "1. ข้อมูลการผลิต"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H80000008&
      Height          =   435
      Left            =   270
      TabIndex        =   34
      Top             =   1215
      Width           =   2460
   End
   Begin VB.Label Label5 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "กะทำงาน :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   510
      TabIndex        =   33
      Top             =   2745
      Width           =   1290
   End
   Begin VB.Label Label6 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "ใบสั่งผลิต :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   525
      TabIndex        =   32
      Top             =   3510
      Width           =   1275
   End
   Begin VB.Label Label7 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "Line ผลิต :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   420
      TabIndex        =   31
      Top             =   4275
      Width           =   1380
   End
   Begin VB.Label lblOrderType 
      Alignment       =   2  'Center
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   4725
      TabIndex        =   30
      Top             =   4185
      Width           =   1455
   End
   Begin VB.Label Label8 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "Reel No :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   465
      TabIndex        =   29
      Top             =   4995
      Width           =   1335
   End
   Begin VB.Label lblDcsNo 
      Alignment       =   2  'Center
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   1890
      TabIndex        =   28
      Top             =   5670
      Width           =   2760
   End
   Begin VB.Label Label10 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "DCS No :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   495
      TabIndex        =   27
      Top             =   5865
      Width           =   1305
   End
   Begin VB.Label Label9 
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "2. ข้อมูลลูกม้วน"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   18
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H80000008&
      Height          =   435
      Left            =   6570
      TabIndex        =   26
      Top             =   1230
      Width           =   2340
   End
   Begin VB.Label Label11 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "เกรด :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   6975
      TabIndex        =   25
      Top             =   2115
      Width           =   750
   End
   Begin VB.Label Label12 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "รุ่น :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   7200
      TabIndex        =   24
      Top             =   2880
      Width           =   525
   End
   Begin VB.Label Label13 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "ขนาด :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   6855
      TabIndex        =   23
      Top             =   3645
      Width           =   870
   End
   Begin VB.Label Label14 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "สถานะ :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   6720
      TabIndex        =   22
      Top             =   4635
      Width           =   990
   End
   Begin VB.Label Label17 
      Alignment       =   1  'Right Justify
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "หมายเหตุ :"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000040&
      Height          =   360
      Left            =   6660
      TabIndex        =   21
      Top             =   5760
      Width           =   1320
   End
   Begin VB.Shape Shape2 
      BackColor       =   &H00F1DF89&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H00FFFFC0&
      Height          =   4530
      Left            =   0
      Top             =   1800
      Width           =   6390
   End
   Begin VB.Shape Shape1 
      BackColor       =   &H80000001&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H80000001&
      Height          =   915
      Left            =   -75
      Top             =   -15
      Width           =   15270
   End
   Begin VB.Shape Shape3 
      BackColor       =   &H00F1DF89&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H00F1DF89&
      Height          =   4530
      Left            =   6570
      Top             =   1800
      Width           =   8640
   End
End
Attribute VB_Name = "frmPdRoll"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Dim SndLine1 As String
Dim SndLine2 As String
Dim SndText As String
Dim Line1 As String
Dim Line2 As String
Dim Line3 As String
Dim maxCol As Integer
Dim waitTime As Integer

Private Sub cbHoldCause_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub cmdCloseReel_Click()
Dim Sql As String
Dim varConfirm As Integer

varConfirm = MsgBox("ยืนยันการปิด Reel", vbOKCancel + vbQuestion, "ปิด Reel")
If varConfirm = vbOK Then
    Sql = "update qc_reel" & _
            " set roll_qty=(select count(id) from pd_roll where qc_reel_id=" & re_id & ")" & _
            " where id=" & re_id
    conn.Execute Sql
End If

End Sub

Private Sub cmdGetWeight_Click()

    Dim KPos As String
    Dim PPos As String
    Dim varWeight As String
    
  'txtWeight = 1000   'ใช้สำหรับทดสอบโปรแกรมนะครับ
       varWeight = MSComm1.Input

   If InStr(varWeight, "k") = 0 Then
        Me.MousePointer = vbDefault
        cmdGetWeight.Enabled = True
        Exit Sub

    End If

    KPos = InStrRev(varWeight, "k")                             'หาตำแหน่งของตัว k โดยเริ่มจากท้าย
    PPos = InStrRev(varWeight, "+", KPos) + 1         'หาตำแหน่งของเครื่องหมาย + โดยนับจากท้าย โดยเริ่มจากตำแหน่งของตัว k

    txtWeight = Val(Trim(Mid(varWeight, PPos, KPos - PPos)))         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร

    DoEvents

End Sub

Private Sub cmdGradeLov_Click()
    frmGradeLov.Left = (Screen.Width / 2) - (frmGradeLov.Width / 2)
    frmGradeLov.Top = (Screen.Height / 2) - (frmGradeLov.Height / 2)
    frmGradeLov.Show vbModal
End Sub
'
'Private Sub cmdPartBack_Click()
'Dim Pos As Integer
'Dim varPart As String
'Dim varDate As String
'Dim Sql As String
'
'
'Pos = InStr(txtDatePart, ":")
'varPart = Trim(Left(txtDatePart, Pos - 1))
'varDate = Trim(Mid(txtDatePart, Pos + 1))
'
'If varPart = "เช้า" Then
'    varPart = "ดึก"
'    varDate = DateAdd("d", -1, CDate(varDate))
'ElseIf varPart = "บ่าย" Then
'    varPart = "เช้า"
'Else
'    varPart = "บ่าย"
'
'End If
'    Sql = "update pd_date_part set part_date=to_date('" & varDate & "','dd/mm/yyyy'), "
'    Sql = Sql + " part ='" & varPart & "'"
'
'    conn.Execute Sql
'
'    txtDatePart = varPart & " : " & Format(varDate, "dd/mm/yyyy")
'
'    Call ShowRollList
'End Sub
'
'Private Sub cmdPartForword_Click()
'Dim Pos As Integer
'Dim varPart As String
'Dim varDate As String
'Dim Sql As String
'
'
'Pos = InStr(txtDatePart, ":")
'varPart = Trim(Left(txtDatePart, Pos - 1))
'varDate = Trim(Mid(txtDatePart, Pos + 1))
'
'If varPart = "เช้า" Then
'    varPart = "บ่าย"
'ElseIf varPart = "บ่าย" Then
'    varPart = "ดึก"
'Else
'    varPart = "เช้า"
'    varDate = DateAdd("d", 1, CDate(varDate))
'End If
'    Sql = "update pd_date_part set part_date=to_date('" & varDate & "','dd/mm/yyyy'), "
'    Sql = Sql + " part ='" & varPart & "'"
'
'    conn.Execute Sql
'
'    txtDatePart = varPart & " : " & Format(varDate, "dd/mm/yyyy")
'
'    Call ShowRollList
'
'End Sub
Private Sub StartPort()
    ActiveHW = False
    HW32 = 0
    HW32 = OpenTVicHW32(HW32, "KLIBDRV", "KLIBDevice0")
    ActiveHW = GetActiveHW(HW32)
    If Not ActiveHW Then
       'Call MsgBox("Can't open the driver!", 0, "Warning!")
       CloseTVicHW32 (HW32)
       'End
    End If
End Sub
Private Sub cmdPrint_Click()
Dim SqlRoll As String
Dim RsRoll As New ADODB.Recordset


    waitTime = 0
    
    If MSComm2.PortOpen = True Then
       MSComm2.PortOpen = False
    End If
     MSComm2.PortOpen = True


    SqlRoll = "select r.roll_no, g.grade, r.model, s.p_size, r.weight, r.diameter, " & _
                    " to_char(r.part_date,'dd/mm/yy') roll_date, pl.production_line, nvl(p.part_code,'') roll_part " & _
                    " from pd_roll r " & _
                    " inner join grade g on g.id=r.grade_id " & _
                    " inner join p_size s on s.id=r.p_size_id " & _
                    " inner join pl_production_line pl on pl.id=r.pl_production_line_id " & _
                    " left join pd_work_part p on p.pl_production_line_id=pl.id and p.work_part=r.part " & _
                    " and to_date(p.work_date,'dd/mm/yyyy')=to_date(r.part_date,'dd/mm/yyyy') " & _
                    " where r.roll_no='" & txtRollListNo & "'"
    RsRoll.Open SqlRoll, conn
    
    If RsRoll.BOF = True And RsRoll.EOF = True Then
        MsgBox "ไม่พบข้อมูลลูกม้วน", vbOKOnly + vbExclamation, "Data not Found"
        txtRollListNo.SetFocus
        txtRollListNo.SelStart = 0
        txtRollListNo.SelLength = Len(txtRollListNo)
        Exit Sub
    End If
    
    cmdPrint.Enabled = False
    'Call OpenCommPort
    'Call StartPort
    Call PrintHead(RsRoll)
    cmdPrint.Enabled = True
    
    'ที่เพิ่มมา
    MSComm2.PortOpen = False
        
    RsRoll.Close
    Set RsRoll = Nothing
End Sub
    
Private Sub PrintHead(RsRoll As ADODB.Recordset)
    Dim Scenter As Integer

    MousePointer = 11
    maxCol = 19

    'filed Grade, Model, Roll Date
    Line1 = RsRoll!grade & RsRoll!model & " - " & RsRoll!roll_date
    Scenter = (maxCol - Len(Line1)) / 2
    'จัดข้อมูลให้อยู่กึ่งกลาง
    If Scenter > 0 Then
        'Line1 = Space(Scenter) & Line1
    End If
    
    'Field PM, Part, Roll No, Diameter
    Line2 = RsRoll!production_line & "-" & RsRoll!roll_part & "-" & RsRoll!roll_no
    Scenter = (maxCol - Len(Line2)) / 2
    If Scenter > 0 Then
        Line2 = Chr(12) & Line2 & Chr(12)
    End If
        
    'Field Size,Weight
    Line3 = RsRoll!diameter & "-" & RsRoll!p_size & "IN-" & RsRoll!Weight & "KG"
    Scenter = (maxCol - Len(Line3)) / 2
    If Scenter > 0 Then
        Line3 = Chr(12) & Line3 & Chr(12)
    End If
    
    SndLine1 = vbCrLf & Chr(12) & Trim(Line1) & Chr(12) & vbCrLf & vbCrLf & Trim(Line2) & vbCrLf
    
    SndLine2 = vbCrLf & Trim(Line3) & vbCrLf
    
    Call SendData
    
    MousePointer = 0
    
End Sub
Private Sub SendData()
Dim sTime As Date

     MSComm2.Output = Chr(4) 'Clear input buffer ล้างข้อมูลในเครื่องพิมพ์
     MSComm2.Output = SndLine1
     sTime = Time
     Do While sTime = Time
     Loop
     MSComm2.Output = SndLine2
     MSComm2.Output = Chr(1) 'สั่งให้เครื่งพิมพ์ พิมพ์ข้อมูลที่อยู่ใน Buffers
     MSComm2.Output = Chr(2) 'Read Input Buffers
     OnOffRelay  'ปิดเปิด Relay เพื่อให้ส่วนควบคุมมอเตอร์หัวพิมพ์ทำงานเลื่อนหัวพิมพ์ลง
    
     SndText = SndLine1 & SndLine2

End Sub

Private Sub OnOffRelay()
     PORTADR = &HF300
     Call SetPortWord(HW32, PORTADR, &HF)
    
    Timer2.Enabled = True
     While waitTime < 10
         DoEvents
     Wend
     OffRelay
     
     Timer2.Enabled = False

End Sub
Private Sub OffRelay()
     PORTADR = &HF300
     Call SetPortWord(HW32, PORTADR, &H0)
End Sub

Private Sub cmdPrint2_Click()
Dim SqlRoll As String
Dim RsRoll As New ADODB.Recordset
    
    waitTime = 0
    
    If MSComm2.PortOpen = True Then
       MSComm2.PortOpen = False
    End If
    MSComm2.PortOpen = True
    
 
    SqlRoll = "select r.roll_no, g.grade, r.model, s.p_size, r.weight, r.diameter, " & _
                    " to_char(r.part_date,'dd/mm/yy') roll_date, pl.production_line, nvl(p.part_code,'') roll_part " & _
                    " from pd_roll r " & _
                    " inner join grade g on g.id=r.grade_id " & _
                    " inner join p_size s on s.id=r.p_size_id " & _
                    " inner join pl_production_line pl on pl.id=r.pl_production_line_id " & _
                    " left join pd_work_part p on p.pl_production_line_id=pl.id and p.work_part=r.part " & _
                    " and to_date(p.work_date,'dd/mm/yyyy')=to_date(r.part_date,'dd/mm/yyyy') " & _
                    " where r.roll_no='" & txtRollNo & "'"
    RsRoll.Open SqlRoll, conn
    
    If RsRoll.BOF = True And RsRoll.EOF = True Then
        MsgBox "ไม่พบข้อมูลลูกม้วน", vbOKOnly + vbExclamation, "Data not Found"
        cmdPrint2.SetFocus
        Exit Sub
    End If
    
    cmdPrint2.Enabled = False
    'Call OpenCommPort
    'Call StartPort
    Call PrintHead(RsRoll)
    cmdPrint2.Enabled = True
    
    MSComm2.PortOpen = False
    
    RsRoll.Close
    Set RsRoll = Nothing
    
    Unload Me
End Sub

Private Sub cmdReelLov_Click()
    
    frmReelLov.Left = (Screen.Width / 2) - (frmReelLov.Width / 2)
    frmReelLov.Top = (Screen.Height / 2) - (frmReelLov.Height / 2)
    frmReelLov.Show vbModal

End Sub

Private Sub ShowRollList()
Dim Rs As New ADODB.Recordset
Dim Sql As String
Dim iRow As Integer

    Sql = "SELECT r.id, r.roll_no, g.id g_id,  g.grade, r.model, s.id s_id, s.p_size, r.weight , re.dcs_reel_no"
    Sql = Sql + " FROM GRADE g, PD_ROLL r, P_SIZE s, QC_REEL re"
    Sql = Sql + " Where g.id = r.grade_id"
    Sql = Sql + " AND s.id=r.p_size_id "
    Sql = Sql + " AND r.pl_production_line_id=" & lineID
    Sql = Sql + " AND r.qc_reel_id=re.id"
    Sql = Sql + " AND to_date(r.part_date,'ddmmyyyy') between to_date(sysdate-1,'ddmmyyyy') and to_date(sysdate+1,'ddmmyyyy') "
    Sql = Sql + " ORDER BY r.roll_no"
    
    Rs.Open Sql, conn, adOpenForwardOnly
    With lstRollList
        .ListItems.Clear
        Do While Not Rs.EOF
            With .ListItems.Add(1, , Rs!Id)
                .ListSubItems.Add , , Rs!roll_no
                .ListSubItems.Add , , Rs!g_id
                .ListSubItems.Add , , Rs!grade
                .ListSubItems.Add , , Rs!model
                .ListSubItems.Add , , Rs!s_id
                .ListSubItems.Add , , Rs!p_size
                .ListSubItems.Add , , Format(Rs!Weight, "#,###")
                .ListSubItems.Add , , IIf(IsNull(Rs!dcs_reel_no) = True, "", Rs!dcs_reel_no)
            End With
            
            Rs.MoveNext
        Loop
        
    End With
    
    Rs.Close
    Set Rs = Nothing

End Sub

Private Sub cmdReprint_Click()
Dim Rs As New ADODB.Recordset
Dim IE As New InternetExplorer

Rs.Open "select id from pd_roll where roll_no='" & txtRollListNo & "'", conn
If Rs.BOF = True And Rs.EOF = True Then
    MsgBox "ไม่พบข้อมูล", vbInformation + vbOKOnly, "Roll"
    Call txtFocus(txtRollListNo)
    Exit Sub
Else
    'แสดง Report ทางเว็บ
    'IE.Visible = True
    'IE.Navigate ("http://akpcappserv/reports/rwservlet?userid=AKPC/GVG8RU:U@AKPC&report=pd_roll.rdf&destype=Cache&desformat=pdf&paramform=no&varRollID=" & Rs!Id)
    
    DERoll.Command1 Rs!Id
    DRRewinder.PrintReport
    DERoll.rsCommand1.Close
    
End If

End Sub

Private Sub cmdSave_Click()
Dim RsSize As New ADODB.Recordset
Dim RsWSt As New ADODB.Recordset
Dim SqlSize As String
Dim SqlWSt As String
Dim SqlInsert As String
Dim SqlInsertQA As String
Dim sqID As Long
Dim Pos As Integer
Dim varStatus As String
Dim varVatType As String

    'เริ่มตรวจสอบค่าว่าง
    If txtReelNo.Text = "" Then
        MsgBox "กรุณาเลือก Reel", vbOKOnly + vbExclamation, "Reel No"
        cmdReelLov.SetFocus
        Exit Sub
    End If
    
    If txtModel.Text = "" Then
        MsgBox "กรุณาระบุรุ่น", vbOKOnly + vbExclamation, "รุ่น"
        txtModel.SetFocus
        Exit Sub
    End If
    
    If txtSize.Text = "" Then
        MsgBox "กรุณาระบุขนาด", vbOKOnly + vbExclamation, "ขนาด"
        txtSize.SetFocus
        Exit Sub
    End If
    
    If txtDiameter.Text = "" Then
        MsgBox "กรุณาระบุ Diameter", vbOKOnly + vbExclamation, "Diameter"
        txtDiameter.SetFocus
        Exit Sub
    End If
    
    If optHold.Value = True Then
        If Trim(cbHoldCause.Text) = "" Then
            MsgBox "กรุณาระบุสาเหตุการ Hold", vbOKOnly + vbExclamation, "สาเหตุ"
            cbHoldCause.SetFocus
            Exit Sub
        End If
    End If
    
    If txtWeight = "" Then
        MsgBox "กรุณารับน้ำหนัก", vbOKOnly + vbExclamation, "รับน้ำหนัก"
        cmdGetWeight.SetFocus
        Exit Sub
    End If
    
    'ตรวจสอบน้ำหนักมาตรฐานลูกม้วน
    If RsWSt.State = adStateOpen Then RsWSt.Close
    SqlWSt = "select r.id from pd_roll_standard r" & _
                " where r.grade_id= " & g_id & " and r.p_size_id= " & s_id & " and" & _
                " (r.wt_min > " & txtWeight & " or r.wt_max < " & txtWeight & ") and rownum=1"
    RsWSt.Open SqlWSt, conn, adOpenForwardOnly, adLockReadOnly
    
    If RsWSt.BOF = False And RsWSt.EOF = False Then
        MsgBox "น้ำหนักลูกม้วนไม่ตรงตามมาตรฐานที่กำหนดไว้ ลูกม้วนจะถูกกำหนดสถานะเป็น Hold", vbOKOnly, "Roll"
        optHold.Value = True
        cbHoldCause.Text = "น้ำหนักไม่ตรงตามมาตรฐาน"
    End If
    
    If K = "K" Or UCase(Left(txtModel, 1)) = "K" Then
        Call RollNoGenK
        varVatType = "NOVAT"
    Else
        Call RollNoGen
        varVatType = "VAT"
    End If
    
    If optPass.Value = True Then
        varStatus = "Pass"
    ElseIf optHold.Value = True Then
        varStatus = "Hold"
    End If
    
    
    sqID = GetSq("pd_roll")
    txtRollID = sqID
    Pos = InStr(txtDatePart, ":")
    
    SqlInsert = "INSERT INTO PD_ROLL (ID, CREATE_DATE, CREATE_STAFF, PART,ROLL_FROM, PL_ORDER_ID, " & _
                        " PL_PRODUCTION_LINE_ID, QC_REEL_ID, ROLL_NO, ROLL_BARCODE, " & _
                        " ROLL_DATE, GRADE_ID, P_SIZE_ID, MODEL, WEIGHT, DIAMETER, STATUS, STOCK_STATUS, REMARKS, " & _
                        " PART_DATE, PL_ORDER_DETAIL_ID, HOLD_CAUSE, R_ROLL, VAT_TYPE) " & _
                        " VALUES (" & txtRollID & ",sysdate," & staffID & ",'" & Trim(Left(txtDatePart, Pos - 1)) & "','จากการผลิต', " & o_id & "," & _
                        pl_id & "," & re_id & ",'" & txtRollNo & "','" & txtRollNo & "'," & _
                        "sysdate," & g_id & "," & s_id & ",'" & txtModel & "'," & txtWeight & "," & txtDiameter & ",'" & varStatus & "','No','" & cbRemarks & "'," & _
                        "to_date('" & Trim(Mid(txtDatePart, Pos + 1)) & "','dd/mm/yyyy')," & od_id & ", '" & cbHoldCause & "'," & varRroll & ",'" & varVatType & "')"
    conn.Execute SqlInsert
    
    SqlInsertQA = "INSERT INTO PD_ROLL_QUALITY (ID, CREATE_DATE, CREATE_STAFF,  PD_ROLL_ID, " & _
                            " BASIS_WEIGHT, BURSTING_STRENGTH, RING_CRUSH, CONCORA, THICKNESS,  COBB, " & _
                            " MOISTURE_CONTENT, CIE_LAB_L, CIE_LAB_A, CIE_LAB_B, BOTTOM_SIDE,  INKJET,  REMARKS) " & _
                            " select sq_pd_roll_quality.nextval, sysdate, -1," & txtRollID & "," & _
                            " BASIS_WEIGHT, BURSTING_STRENGHT, RING_CRUSH, CONCORA, THICKNESS, COBB, " & _
                            " MOISTURE_CONTENT , CIE_LAB_L, CIE_LAB_A, CIE_LAB_B, BOTTOM_SIDE, INKJET, REMARKS" & _
                            " From qc_reel_quality " & _
                            " where qc_reel_id=" & re_id
    conn.Execute SqlInsertQA
    
    Call UpdateStartTime(o_id)           'บันทึกเวลาเริ่มผลิตในใบสั่งผลิต
    Call UpdateFinishTime(od_id)       'บันทึกเวลาที่เสร็จในใบสั่งผลิต

    MsgBox "บันทึกข้อมูลเรียบร้อย ลูกม้วนใหม่รอรับเข้า", vbOKOnly + vbInformation, "ประกาศ Roll"
    
    Call ShowRollList
    
    DERoll.Command1 txtRollID
    DRRewinder.PrintReport
    DERoll.rsCommand1.Close
    
    cmdSave.Enabled = False
    cmdPrint2.Enabled = True
    
  ' If cmdPrint.Visible = False Then
        Unload Me
   ' End If
    
End Sub

Private Sub RollNoGen()
Dim RsRoll As New ADODB.Recordset
Dim RsMaxRoll As New ADODB.Recordset

Dim SqlRoll As String
Dim SqlMaxRoll As String

Dim RunningNo As String
    
    SqlRoll = "select id from pd_roll " & _
                    " where to_char(roll_date,'yyyy')='" & Mid(getDateNow, 7, 4) & "'" & _
                    " and roll_from='จากการผลิต' and pl_production_line_id=" & lineID & _
                    " and substr(model,0,1)<>'K' and pl_order_id<>-1 and rownum=1"
    RsRoll.Open SqlRoll, conn, adOpenForwardOnly, adLockReadOnly
    
    If Not RsRoll.BOF = True And Not RsRoll.EOF = True Then
        SqlMaxRoll = "select max(roll_no) maxRollNo from pd_roll " & _
                                " where to_char(roll_date,'yyyy')='" & Mid(getDateNow, 7, 4) & "'" & _
                                " and roll_from='จากการผลิต' and pl_production_line_id=" & lineID & _
                                " and substr(model,0,1)<>'K' and pl_order_id<>-1"
        RsMaxRoll.Open SqlMaxRoll, conn, adOpenForwardOnly, adLockReadOnly
        
        If Not RsMaxRoll.BOF = True And Not RsMaxRoll.EOF = True Then
'            SqlRollNo = "select roll_no from pd_roll" & _
'                                " where id=" & RsMaxRoll!maxID
'            RsRollNo.Open SqlRollNo, conn, adOpenForwardOnly, adLockReadOnly
            RunningNo = Format(CDbl(Right(Replace(Replace(Replace(Replace(Replace(Replace(RsMaxRoll!maxRollNo, "B", ""), "A", ""), "R", ""), "C", ""), "X", ""), "W", ""), 6)) + 1, "000000")
            txtRollNo = varProductionLine & Mid(getDateNow, 9, 2) & RunningNo
            
        End If
    Else
        'ถ้าเป็นลูกม้วนแรกในปีนี้
            txtRollNo.Text = varProductionLine & Mid(getDateNow, 9, 2) & "000001"
    End If
End Sub

Private Sub RollNoGenK()
Dim RsRoll As New ADODB.Recordset
Dim RsMaxRoll As New ADODB.Recordset
Dim RsRollNo As New ADODB.Recordset

Dim SqlRoll As String
Dim SqlMaxRoll As String
Dim SqlRollNo As String
Dim PosK As Integer

Dim RunningNo As String
    
    SqlRoll = "select id from pd_roll " & _
                    " where to_char(roll_date,'yyyy')='" & Mid(getDateNow, 7, 4) & "'" & _
                    " and roll_from='จากการผลิต' and pl_production_line_id=" & lineID & _
                    " and substr(model,0,1)='K' and pl_order_id<>-1 and instr(roll_no,'K',6)>0 and rownum=1"
    RsRoll.Open SqlRoll, conn, adOpenForwardOnly, adLockReadOnly
    
    If Not RsRoll.BOF = True And Not RsRoll.EOF = True Then
        SqlMaxRoll = "select max(id) maxID from pd_roll " & _
                                " where to_char(roll_date,'yyyy')='" & Mid(getDateNow, 7, 4) & "'" & _
                                " and roll_from='จากการผลิต' and pl_production_line_id=" & lineID & _
                                " and substr(model,0,1)='K' and instr(roll_no,'K',6)>0 and pl_order_id<>-1"
        RsMaxRoll.Open SqlMaxRoll, conn, adOpenForwardOnly, adLockReadOnly
        
        If Not RsMaxRoll.BOF = True And Not RsMaxRoll.EOF = True Then
            SqlRollNo = "select roll_no from pd_roll" & _
                                " where id=" & RsMaxRoll!maxID
            RsRollNo.Open SqlRollNo, conn, adOpenForwardOnly, adLockReadOnly
            
            PosK = InStr(1, RsRollNo!roll_no, "K") - 6
            RunningNo = Format(CInt(Mid(RsRollNo!roll_no, PosK, 6)) + 1, "000000") & "K"
            txtRollNo = varProductionLine & Mid(getDateNow, 9, 2) & RunningNo
            
        End If
    Else
        'ถ้าเป็นลูกม้วนแรกในปีนี้
        txtRollNo.Text = varProductionLine & Mid(getDateNow, 9, 2) & "000001K"
    End If

End Sub
Private Sub UpdateFinishTime(varPlOrderDetailID As Long)
    conn.Execute "Update PL_ORDER_DETAIL Set finish_date_time=sysdate Where id=" & varPlOrderDetailID
End Sub

Private Sub UpdateStartTime(varOrderID As Long)
Dim Sql As String
Dim Rs As New ADODB.Recordset

    Sql = "select o.start_order " & _
            " from pl_order o " & _
            " where o.id= " & varOrderID
    Rs.Open Sql, conn
    
    If IsNull(Rs!start_order) Then
        conn.Execute "Update PL_ORDER Set start_order=sysdate Where id=" & varOrderID
    End If
        
    conn.Execute "Update PL_ORDER Set finish_order=sysdate Where id=" & varOrderID
End Sub

Private Sub Form_Load()
    Call GetRollValue
    Call GetDatePart
    Call AddHoldCauseList
    Call AddRemarksList
    Call AddRollListColumn
    Call ShowRollList
    Call OpenCommPort
    Call OffRelay
End Sub


Private Sub AddRollListColumn()
    
    lstRollList.View = lvwReport

    Call AddListColumn(lstRollList, "id", 1, 0, "NUMBER")
    Call AddListColumn(lstRollList, "Roll No", 2, 1400, "STRING")
    Call AddListColumn(lstRollList, "g_id", 3, 0, "NUMBER")
    Call AddListColumn(lstRollList, "Grade", 4, 1000, "STRING")
    Call AddListColumn(lstRollList, "Model", 5, 800, "STRING")
    Call AddListColumn(lstRollList, "s_id", 6, 0, "NUMBER")
    Call AddListColumn(lstRollList, "Size", 7, 800, "NUMBER")
    Call AddListColumn(lstRollList, "Weight", 8, 900, "NUMBER")
    Call AddListColumn(lstRollList, "Reel", 9, 900, "NUMBER")
End Sub


Private Sub OpenCommPort()
    MSComm1.Settings = "2400,N,7,1"         'สำหรับ AKPC
    'MSComm1.Settings = "115200,N,8,1"    'สำหรับทดสอบ
    MSComm1.Handshaking = comXOnXoff
    
    If MSComm1.PortOpen = False Then      'ถ้าปิดอยู่ก็ให้เปิดซะ
        MSComm1.PortOpen = True  'เปิด Comport
    End If
End Sub

Private Sub Form_Unload(Cancel As Integer)
    If MSComm1.PortOpen = True Then
        MSComm1.PortOpen = False
    End If
    
    If MSComm2.PortOpen = True Then
        MSComm2.PortOpen = False
    End If
    
    frmRollWaitDeclare.Show
End Sub


Private Sub lstRollList_Click()
On Error GoTo lstRollList_Click_Err:

txtRollListNo.Text = lstRollList.SelectedItem.SubItems(1)

Exit Sub
lstRollList_Click_Err:
    If Err.Number = 35600 Then
    
    End If

End Sub

Private Sub MSComm1_OnComm()
On Error GoTo MSComm1_OnComm_Err:

Dim KPos As String
Dim PPos As String
Dim varWeight As String

' ไปเขียนที่ cmdGetWeight_Click แล้ว
'    varWeight = MSComm1.Input
'
'    'Debug.Print Now()
''         MsgBox varWeight
'   If InStr(varWeight, "k") = 0 Then
'        Me.MousePointer = vbDefault
'        cmdGetWeight.Enabled = True
'        Exit Sub
'
'    End If
'
'    KPos = InStrRev(varWeight, "k")                             'หาตำแหน่งของตัว k โดยเริ่มจากท้าย
'    PPos = InStrRev(varWeight, "+", KPos) + 1         'หาตำแหน่งของเครื่องหมาย + โดยนับจากท้าย โดยเริ่มจากตำแหน่งของตัว k
'
'    'txtWeight = Val(Trim(Mid(varWeight, PPos, KPos - PPos)))         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร
'
'    MSFWeight.AddItem Val(Trim(Mid(varWeight, PPos, KPos - PPos))) & vbTab        'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร
'
'    DoEvents
    

    
    
    Exit Sub
    
MSComm1_OnComm_Err:
If Err.Number <> 0 Then
    MsgBox Err.Description, vbOKOnly + vbExclamation, "Error"
    Exit Sub
End If
End Sub


Private Sub optHold_Click()
    If optHold.Value = True Then
        cbHoldCause.Enabled = True
    End If
End Sub

Private Sub optPass_Click()
    If optPass.Value = True Then
        cbHoldCause.Enabled = False
    End If
End Sub

Private Sub Timer1_Timer()
 GetInput
End Sub

Private Sub GetInput()
Dim ax As Long
Dim HeadReady As String
     PORTADR = &HF300
     ax = GetPortWord(HW32, PORTADR)
     ax = HexToInt("F3FF") - HexToInt(IntToHex4(ax))
     If ax = 0 Then
         HeadReady = "Not Ready"
     Else
         HeadReady = "Ready"
     End If
End Sub

Private Sub Timer2_Timer()
    waitTime = waitTime + 1
End Sub

Private Sub txtDatePart_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtDiameter_KeyPress(KeyAscii As Integer)
    Select Case KeyAscii
        Case 48 To 57, 8

        Case Asc(".")
            If InStr(txtDiameter, ".") > 0 Then
                KeyAscii = 0
            End If
        Case Else
            KeyAscii = 0
    End Select
End Sub

Private Sub txtGrade_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtModel_KeyPress(KeyAscii As Integer)
    If varOrderType = "ปกติ" Or K = "K" Then
        KeyAscii = 0
    End If
End Sub

Private Sub txtModel_LostFocus()
    txtModel = UCase(txtModel)
End Sub

Private Sub txtOrderNo_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtProdLine_KeyPress(KeyAscii As Integer)
    If varOrderType <> "ปกติ" Then
        KeyAscii = 0
    End If
End Sub

Private Sub txtReelNo_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtSize_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub AddHoldCauseList()
Dim Rs As New ADODB.Recordset
Dim Sql As String
    Sql = "select repair_name " & _
                " From qc_repair_type " & _
                " order by repair_name"
    Rs.Open Sql, conn, adOpenForwardOnly
    
    cbHoldCause.Clear
    Do While Not Rs.EOF
        cbHoldCause.AddItem IIf(IsNull(Rs!repair_name), "", Rs!repair_name)
        Rs.MoveNext
    Loop
End Sub

Private Sub AddRemarksList()
Dim Rs As New ADODB.Recordset
Dim Sql As String
    Sql = "select distinct remarks" & _
            " from pd_roll " & _
            " order by remarks"
    Rs.Open Sql, conn, adOpenForwardOnly
    
    cbRemarks.Clear
    Do While Not Rs.EOF
        cbRemarks.AddItem IIf(IsNull(Rs!REMARKS), "", Rs!REMARKS)
        Rs.MoveNext
    Loop
End Sub

Private Sub GetRollValue()
    Me.txtOrderNo = varOrderNoR
    Me.txtProdLine = varProductionLine
    Me.lblOrderType = varOrderType
    Me.txtGrade = varGrade
    Me.txtModel = varModel
    Me.txtSize = varSize
    Me.txtDiameter = varDiameter
End Sub

Private Sub GetDatePart()
Dim Rs As New ADODB.Recordset
Dim Sql As String
Dim varPart As String
Dim vardate As String

    Sql = "select case " & _
            "when  to_number(part)    < 8 then " & _
                " to_char (partdate-1,'dd/mm/yyyy') " & _
                " else  to_char (partdate,'dd/mm/yyyy') " & _
                " end partdate,part  " & _
                "From  " & _
                "(  " & _
                    "select sysdate partdate , to_char(sysdate,'hh24')  part  " & _
                    " From dual  " & _
                ") a "
    Rs.Open Sql, conn, adOpenForwardOnly
    vardate = Rs!partdate
  '  If Rs.EOF And Rs.BOF Then
        If CInt(Rs!part) >= 0 And CInt(Rs!part) < 8 Then
            varPart = "ดึก"
        ElseIf CInt(Rs!part) >= 8 And CInt(Rs!part) < 16 Then
            varPart = "เช้า"
        Else
            varPart = "บ่าย"
        End If

    txtDatePart = varPart & " : " & vardate
    Rs.Close
    Set Rs = Nothing
End Sub


