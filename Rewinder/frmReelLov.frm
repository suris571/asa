VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form frmReelLov 
   Caption         =   "Grade"
   ClientHeight    =   6825
   ClientLeft      =   3555
   ClientTop       =   2460
   ClientWidth     =   7935
   LinkTopic       =   "Form1"
   ScaleHeight     =   6825
   ScaleWidth      =   7935
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
      Left            =   4830
      TabIndex        =   5
      Top             =   6285
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
      Left            =   6225
      TabIndex        =   4
      Top             =   6285
      Width           =   1140
   End
   Begin VB.Frame Frame1 
      Height          =   870
      Left            =   45
      TabIndex        =   2
      Top             =   45
      Width           =   7755
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
         Left            =   1920
         TabIndex        =   0
         Text            =   "%"
         Top             =   210
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
         Left            =   5520
         TabIndex        =   3
         Top             =   210
         Width           =   1230
      End
      Begin VB.Label Label1 
         Caption         =   "Reel No"
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
         Left            =   660
         TabIndex        =   6
         Top             =   300
         Width           =   1230
      End
   End
   Begin MSComctlLib.ListView lstReelLov 
      Height          =   5280
      Left            =   45
      TabIndex        =   1
      Top             =   945
      Width           =   7785
      _ExtentX        =   13732
      _ExtentY        =   9313
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
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      NumItems        =   0
   End
End
Attribute VB_Name = "frmReelLov"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cmdCancel_Click()
    Unload Me
End Sub

Private Sub cmdOK_Click()
    re_id = lstReelLov.SelectedItem
    frmPdRoll.txtReelNo = lstReelLov.SelectedItem.ListSubItems(1)
    frmPdRoll.lblDcsNo = lstReelLov.SelectedItem.ListSubItems(5)
    
    If lstReelLov.SelectedItem.ListSubItems(4) = "Pass" Then
        frmPdRoll.optPass = True
    Else
        frmPdRoll.optHold = True
    End If
    
    frmPdRoll.cmdCloseReel.Enabled = True
    Unload Me
End Sub

Private Sub cmdSearch_Click()
Dim Rs As New ADODB.Recordset
Dim Sql As String
Dim iRow As Integer

    Sql = "SELECT r.id, r.reel_no, r.barcode, g.grade,"
    Sql = Sql + " TO_CHAR(r.qc_date,'DD/MM/YYYY')  qc_date, r.dcs_reel_no, r.status,"
    Sql = Sql + " r.roll_qty-(select count(id) from pd_roll where qc_reel_id=r.id) remain"
    Sql = Sql + " FROM GRADE g, QC_REEL r"
    Sql = Sql + " Where g.id = r.grade_id"
    Sql = Sql + " AND r.pl_production_line_id=" & lineID
    Sql = Sql + " AND r.roll_qty>(select count(id) from pd_roll where qc_reel_id=r.id)"
    
    If txtSearch <> "" Then
        Sql = Sql + " AND r.reel_no LIKE '" & txtSearch & "'"
    End If
    
    Sql = Sql + " ORDER BY r.reel_no asc"
    
    Rs.Open Sql, conn, adOpenForwardOnly
    With lstReelLov
        .ListItems.Clear
        iRow = 1
        Do While Not Rs.EOF
            With .ListItems.Add(iRow, , Rs!Id)
                .ListSubItems.Add , , Rs!reel_no
                .ListSubItems.Add , , Rs!grade
                .ListSubItems.Add , , Rs!qc_date
                .ListSubItems.Add , , Rs!Status
                .ListSubItems.Add , , IIf(IsNull(Rs!dcs_reel_no) = True, "", Rs!dcs_reel_no)
                .ListSubItems.Add , , Format(Rs!remain, "#,##0")
            End With
            
            Rs.MoveNext
        Loop
        
    End With
    
    Rs.Close
    Set Rs = Nothing
End Sub

Private Sub Form_Load()

    lstReelLov.View = lvwReport

    Call AddListColumn(lstReelLov, "re_id", 1, 0, "NUMBER")
    Call AddListColumn(lstReelLov, "Reel No", 2, 1700, "STRING")
    Call AddListColumn(lstReelLov, "Grade", 3, 1000, "STRING")
    Call AddListColumn(lstReelLov, "Date", 4, 1500, "DATE")
    Call AddListColumn(lstReelLov, "Status", 5, 1000, "STRING")
    Call AddListColumn(lstReelLov, "Dcs No", 6, 1200, "STRING")
    Call AddListColumn(lstReelLov, "Remain", 7, 1000, "NUMBER")

    Call cmdSearch_Click

End Sub

Private Sub lstReelLov_DblClick()
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
