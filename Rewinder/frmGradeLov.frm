VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form frmGradeLov 
   Caption         =   "Grade"
   ClientHeight    =   6825
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   9690
   LinkTopic       =   "Form1"
   ScaleHeight     =   6825
   ScaleWidth      =   9690
   StartUpPosition =   3  'Windows Default
   Begin MSComctlLib.ListView lstGradeLov 
      Height          =   5235
      Left            =   45
      TabIndex        =   6
      Top             =   945
      Width           =   9600
      _ExtentX        =   16933
      _ExtentY        =   9234
      LabelWrap       =   -1  'True
      HideSelection   =   -1  'True
      Checkboxes      =   -1  'True
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      HotTracking     =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "Tahoma"
         Size            =   24
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      NumItems        =   0
   End
   Begin VB.CommandButton cmdOK 
      Caption         =   "&ตกลง"
      Default         =   -1  'True
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   465
      Left            =   7065
      TabIndex        =   4
      Top             =   6300
      Width           =   1140
   End
   Begin VB.CommandButton cmdCancel 
      Caption         =   "&ยกเลิก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   465
      Left            =   8460
      TabIndex        =   3
      Top             =   6300
      Width           =   1140
   End
   Begin VB.Frame Frame1 
      Height          =   870
      Left            =   45
      TabIndex        =   1
      Top             =   45
      Width           =   9600
      Begin VB.TextBox txtSearch 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   510
         Left            =   2880
         TabIndex        =   0
         Text            =   "%"
         Top             =   225
         Width           =   3480
      End
      Begin VB.CommandButton cmdSearch 
         Caption         =   "&ค้นหา"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   14.25
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   510
         Left            =   6480
         TabIndex        =   2
         Top             =   225
         Width           =   1230
      End
      Begin VB.Label Label1 
         Caption         =   "Grade"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   14.25
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   1620
         TabIndex        =   5
         Top             =   315
         Width           =   1230
      End
   End
End
Attribute VB_Name = "frmGradeLov"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cmdOK_Click()
    g_id = lstGradeLov.SelectedItem
    frmPdRoll.txtGrade = lstGradeLov.SelectedItem.ListSubItems(1)
    Unload Me
End Sub

Private Sub cmdSearch_Click()
Dim Rs As New ADODB.Recordset
Dim Sql As String
Dim iRow As Integer

    Sql = "SELECT g.id, g.grade"
    Sql = Sql + " FROM GRADE g"
    Sql = Sql + " Where 1=1 "
    If txtSearch <> "" Then
        Sql = Sql + " and g.grade LIKE '" & txtSearch & "'"
    End If
    Sql = Sql + " ORDER BY g.grade"
    
    Rs.Open Sql, conn, adOpenForwardOnly
    With lstGradeLov
        .ListItems.Clear
        iRow = 1
        Do While Not Rs.EOF
            With .ListItems.Add(iRow, , Rs!Id)
                .ListSubItems.Add , , Rs!grade
            End With

            Rs.MoveNext
        Loop
        
    End With
    
    Rs.Close
    Set Rs = Nothing
End Sub

Private Sub Form_Load()
    
    lstGradeLov.View = lvwReport

    Call AddListColumn(lstGradeLov, "g_id", 1, 0, "NUMBER")
    Call AddListColumn(lstGradeLov, "Grade", 2, 3500, "STRING")
    
    Call cmdSearch_Click

End Sub

Private Sub lstGradeLov_DblClick()
    Call cmdOK_Click
End Sub

Private Sub txtSearch_GotFocus()
    cmdSearch.Default = True
    Call txtFocus(txtSearch)
End Sub

Private Sub txtSearch_KeyPress(KeyAscii As Integer)
    If KeyAscii = 13 Then
        KeyAscii = 0
        Call cmdSearch_Click
    End If
End Sub

Private Sub txtSearch_LostFocus()
    cmdOK.Default = True
End Sub
