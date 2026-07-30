VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "mscomctl.ocx"
Begin VB.Form frmRollWaitDeclare 
   BorderStyle     =   1  'Fixed Single
   ClientHeight    =   10830
   ClientLeft      =   255
   ClientTop       =   120
   ClientWidth     =   15210
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   10830
   ScaleWidth      =   15210
   WindowState     =   2  'Maximized
   Begin VB.TextBox txtSearchItem 
      Alignment       =   2  'Center
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   420
      Left            =   11790
      TabIndex        =   1
      Top             =   180
      Width           =   705
   End
   Begin VB.CommandButton cmdExit 
      Caption         =   "X"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   585
      Left            =   14280
      TabIndex        =   6
      Top             =   105
      Width           =   765
   End
   Begin VB.TextBox txtSearchOrderNo 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   420
      Left            =   9135
      TabIndex        =   0
      Top             =   180
      Width           =   1800
   End
   Begin VB.CommandButton cmdSearch 
      BackColor       =   &H80000010&
      Caption         =   "&ค้นหา"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   420
      Left            =   12945
      TabIndex        =   2
      Top             =   180
      Width           =   1110
   End
   Begin MSComctlLib.ListView lstRollWaitDeclare 
      Height          =   9840
      Left            =   120
      TabIndex        =   3
      Top             =   885
      Width           =   15060
      _ExtentX        =   26564
      _ExtentY        =   17357
      View            =   3
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
      Appearance      =   0
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      NumItems        =   0
   End
   Begin VB.Label Label3 
      BackStyle       =   0  'Transparent
      Caption         =   "Item"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Left            =   11160
      TabIndex        =   7
      Top             =   225
      Width           =   600
   End
   Begin VB.Label Label2 
      BackStyle       =   0  'Transparent
      Caption         =   "ใบสั่งผลิต"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Left            =   7995
      TabIndex        =   5
      Top             =   225
      Width           =   1080
   End
   Begin VB.Label Label1 
      BackColor       =   &H000040C0&
      BackStyle       =   0  'Transparent
      Caption         =   "ข้อมูลลูกม้วนที่รอประกาศ"
      BeginProperty Font 
         Name            =   "Tahoma"
         Size            =   20.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   555
      Left            =   180
      TabIndex        =   4
      Top             =   120
      Width           =   6705
   End
   Begin VB.Shape Shape1 
      BackColor       =   &H00C0C000&
      BackStyle       =   1  'Opaque
      BorderColor     =   &H00C0C000&
      FillColor       =   &H00FFFFFF&
      Height          =   825
      Left            =   0
      Top             =   0
      Width           =   15330
   End
End
Attribute VB_Name = "frmRollWaitDeclare"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Dim setForeColor As String
Dim roll_set  As String
Dim varOrderNo As String
Dim varOrderItem As Integer
Dim varItemBold As Boolean
Dim Rs As New ADODB.Recordset
Public varWaitOrderNo As String
Public varWaitItem As Integer

Private Sub cmdExit_Click()
    staffID = 0
    depID = 0
    varWaitOrderNo = ""
    varWaitItem = 0
    autoSearch = 0
    frmLogin.Show
    Unload frmRollWaitDeclare
End Sub

Public Sub cmdSearch_Click()
Dim Sql As String

If varWaitOrderNo = "" Or varWaitItem = 0 Then
    If txtSearchOrderNo = "" Then
        MsgBox "กรุณาระบุเลขที่ใบสั่งผลิต", vbOKOnly + vbExclamation, "ประกาศ Roll"
        txtSearchOrderNo.SetFocus
        lstRollWaitDeclare.ListItems.Clear
        Exit Sub
    End If

'    If txtSearchItem = "" Then
 '       MsgBox "กรุณาระบุ Item", vbOKOnly + vbExclamation, "ประกาศ Roll"
   '     txtSearchItem.SetFocus
    '    Exit Sub
   ' End If
End If
    
Sql = "select id, pl_id, production_line, o_id, order_no, to_char(order_date,'dd/mm/yyyy') order_date, "
Sql = Sql + " model, case  when k='Y' then 'K' else '' end k,type_of_order, diameter, item, g_id, grade, over_size, s_id, p_size, order_item, order_qty, "
Sql = Sql + " declare_qty, remain_qty, r_roll"
Sql = Sql + " From v_pd_roll_wait_declare_list "
Sql = Sql + " Where pl_id=" & lineID

If txtSearchOrderNo <> "" Then
    Sql = Sql + " and order_no like '" & txtSearchOrderNo & "'"
Else
    Sql = Sql + " and order_no like '" & varWaitOrderNo & "'"
    txtSearchOrderNo = varWaitOrderNo
    txtSearchItem = varWaitItem
End If



If txtSearchItem <> "" Then
   Sql = Sql + " and order_item like '" & txtSearchItem & "'"
'Else
   'Sql = Sql + " and order_item like '" & varWaitItem & "'"
   'txtSearchItem = varWaitItem
End If

Sql = Sql + " order by type_of_order desc, order_no desc,  order_item, p_size"
Rs.Open Sql, conn, adOpenForwardOnly


Call ShowListView(lstRollWaitDeclare)
Rs.Close
Set Rs = Nothing
End Sub

Private Sub ShowListView(lListView As ListView)
    Dim iRow As Integer
    Dim i As Integer
    
    If Rs.BOF = True And Rs.EOF = True Then
        MsgBox "ไม่พบข้อมูลลูกม้วนที่รอประกาศ", vbOKOnly + vbInformation, "ลูกม้วนที่รอประกาศ"
        lstRollWaitDeclare.ListItems.Clear
        Exit Sub
    Else
        With lListView
            .ListItems.Clear
            iRow = 1
                setForeColor = &H80000008
           ' .ForeColor = &H8000000D
            Do While Not Rs.EOF
                With lstRollWaitDeclare.ListItems.Add(iRow, , Rs!pl_id)
                    .ListSubItems.Add , , Rs!production_line
                    .ListSubItems.Add , , Rs!o_id
                    .ListSubItems.Add , , Rs!order_no
                    .ListSubItems.Add , , Rs!order_date
                    .ListSubItems.Add , , Rs!type_of_order
                    .ListSubItems.Add , , IIf(IsNull(Rs!order_item) = True, "", Rs!order_item)
                    .ListSubItems.Add , , Rs!g_id
                    .ListSubItems.Add , , Rs!grade
                    .ListSubItems.Add , , Rs!model
                    .ListSubItems.Add , , IIf(Rs!K = "K", "K", "")
                    .ListSubItems.Add , , Rs!s_id
                    .ListSubItems.Add , , Rs!p_size
                    .ListSubItems.Add , , IIf(IsNull(Rs!over_size) = True, 0, Rs!over_size)
                    .ListSubItems.Add , , Rs!order_qty
                    .ListSubItems.Add , , Rs!declare_qty
                    .ListSubItems.Add , , Rs!remain_qty
                    .ListSubItems.Add , , Rs!Id
                    .ListSubItems.Add , , Rs!diameter
                    .ListSubItems.Add , , Rs!r_roll
                    
                End With
                
                Call ChangeColor(Rs!order_no, IIf(IsNull(Rs!order_item) = True, 0, Rs!order_item))        'สับสีในแถว
                
                With .ListItems.Item(iRow)
                    .Bold = True
                    
                    
                    For i = 1 To .ListSubItems.Count
                        .ListSubItems.Item(i).Bold = True
                        .ListSubItems.Item(i).ForeColor = setForeColor
                    Next i
                End With
                
                varOrderNo = Rs!order_no
                varOrderItem = IIf(IsNull(Rs!order_item) = True, 0, Rs!order_item)
                
                iRow = iRow + 1
                Rs.MoveNext
            Loop
        End With
    
    End If

End Sub

Private Sub Form_Load()
    Dim RsLine As New ADODB.Recordset
    
    lstRollWaitDeclare.View = lvwReport
    
    Call AddListColumn(lstRollWaitDeclare, "pl_id", 1, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "Line", 2, 1100, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "o_id", 3, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "เลขที่ใบสั่ง", 4, 1600, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "วันที่", 5, 1600, "DATE")
    Call AddListColumn(lstRollWaitDeclare, "ชนิดใบสั่ง", 6, 1200, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "Roll Item", 7, 1200, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "g_id", 8, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "เกรด", 9, 1100, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "รุ่น", 10, 800, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "K", 11, 400, "STRING")
    Call AddListColumn(lstRollWaitDeclare, "s_id", 12, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "ขนาด", 13, 1000, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "ตั้งใบมีด", 14, 1100, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "จำนวนสั่ง", 15, 1100, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "จำนวนประกาศ", 16, 1500, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "คงเหลือ", 17, 1200, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "id", 18, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "diameter", 19, 0, "NUMBER")
    Call AddListColumn(lstRollWaitDeclare, "r_roll", 20, 0, "NUMBER")
    
    RsLine.Open "select production_line from pl_production_line where id=" & lineID, conn
    
    If RsLine.BOF = False And RsLine.EOF = False Then
        Label1.Caption = "ข้อมูลลูกม้วนที่รอประกาศ ของ PM" & RsLine!production_line
    End If
    
    RsLine.Close
    Set RsLine = Nothing
    
    setForeColor = &H80000008
    If autoSearch = 1 Then
        cmdSearch_Click
    End If
    
    If lineID = 162 Then     'ถ้าทำงานที่ PM2 ถึงจะโหลด Driver ตัวพิมพ์ข้างลูก
        If ActiveHW = False Then
            Call StartPort
        End If
    End If
End Sub

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

Private Sub lstRollWaitDeclare_DblClick()
    On Error GoTo lstRollWaitDeclare_DbClice_Err:
    With lstRollWaitDeclare
        pl_id = .SelectedItem
        varProductionLine = .SelectedItem.SubItems(1)
        roll_set = .SelectedItem.SubItems(6)
        o_id = .SelectedItem.SubItems(2)
        varOrderNoR = .SelectedItem.SubItems(3)
        varOrderType = .SelectedItem.SubItems(5)
        od_id = .SelectedItem.SubItems(17)
        g_id = .SelectedItem.SubItems(7)
        varGrade = .SelectedItem.SubItems(8)
        s_id = .SelectedItem.SubItems(11)
        varSize = .SelectedItem.SubItems(12)
        varRroll = .SelectedItem.SubItems(19)
        varModel = .SelectedItem.SubItems(9)
        K = .SelectedItem.SubItems(10)
        varDiameter = .SelectedItem.SubItems(18)
    End With
    If txtSearchItem = "" Then
       MsgBox "กรุณาระบุ Item", vbOKOnly + vbExclamation, "ประกาศ Roll"
       txtSearchItem.SetFocus
        Exit Sub
    Else
         If txtSearchItem <> roll_set Then
            MsgBox "กรุณาระบุItem ใหม่"
            txtSearchItem.SetFocus
             Exit Sub
        End If
    End If
    frmPdRoll.Show
    frmPdRoll.txtProdDate = getDateNow
    If lineID = 161 Then         'ถ้าเป็น PM1  ไม่ต้องโชว์ปุ่มพิมพ์ข้างลูก
        frmPdRoll.cmdPrint.Visible = False
        frmPdRoll.cmdPrint2.Visible = False
    End If
    
    If frmPdRoll.cmdPrint.Visible = False Then
        frmPdRoll.cmdSave.Left = (frmPdRoll.Frame3.Width / 2) - (frmPdRoll.cmdSave.Width / 2)
    End If
    
    autoSearch = 1
    
    If varOrderType <> "ปกติ" Then
        frmPdRoll.cmdGradeLov.Visible = True
        If K = "K" Then        'ถ้าเป็นรุ่น K จะไม่ให้แก้รุ่น
            frmPdRoll.txtModel.BackColor = &H8000000F
        Else
            frmPdRoll.txtModel.BackColor = &H80000005
        End If
        
        frmPdRoll.txtSize.BackColor = &H80000005
    End If
    
    varWaitOrderNo = txtSearchOrderNo
    varWaitItem = txtSearchItem
    
    Unload frmRollWaitDeclare
    
    Exit Sub
    
lstRollWaitDeclare_DbClice_Err:
    If Err.Number = 35600 Then
    
    End If
    
End Sub

Private Sub ChangeColor(rowOrderNo As String, rowOrderItem As Integer)
    If varOrderNo <> rowOrderNo Or varOrderItem <> rowOrderItem Then
        
        If setForeColor = &H80000008 Then         'สลับสี
            setForeColor = &H8000000D
        Else
            setForeColor = &H80000008
        End If
    End If
End Sub

Private Sub lstRollWaitDeclare_ColumnClick(ByVal ColumnHeader As MSComctlLib.ColumnHeader)
    Call SortColumnClick(lstRollWaitDeclare, ColumnHeader)
End Sub



Private Sub txtSearchItem_KeyPress(KeyAscii As Integer)
    If KeyAscii = 13 Then
        Call cmdSearch_Click
    End If
    
End Sub



Private Sub txtSearchOrderNo_KeyPress(KeyAscii As Integer)
    If KeyAscii = 13 Then
        Call cmdSearch_Click
    End If
    

End Sub
