Attribute VB_Name = "Module1"

'สำหรับติดต่อกับฐานข้อมูล
Public txtConn As String
Public conn As New ADODB.Connection

'สำหรับเก็บข้อมูลของผู้ที่เข้าระบบ
Public staffID As Integer       'id ของผู้เข้าระบบ
Public depID As Integer        'id ของแผนก

Public lineID As Integer           'Line การผลิต
Public WeightID As Integer     'ตาชั่ง

Public autoSearch As Integer     'สำหรับใช้กดปุ่ม Search ในหน้าลูกม้วนที่รอประกาศ

'ค่าเริ่มต้นที่ส่งไปหน้าประกาศ Roll
Public pl_id As Long
Public varProductionLine As String
Public o_id As Long
Public varOrderNoR As String
Public varOrderType As String
Public od_id As Long
Public g_id As Long
Public varGrade As String
Public s_id As Long
Public varSize As Double
Public varModel As String
Public K As String
Public varDiameter As Double
Public varRroll As Integer

Public re_id As Long

'สำหรับตรวจสอบเมนูในหน้า Login
Public frmID As Integer

Private Declare Function LockWindowUpdate Lib "user32" (ByVal hWndLock As Long) As Long

Public Sub Main()
    txtConn = "Provider=MSDAORA.1;Password=gvg8ru:u;User ID=akpc;Data Source=AKPC;Persist Security Info=True"
'    txtConn = "Provider=MSDAORA.1;Password=gvg8ru:u;User ID=akpc;Data Source=00;Persist Security Info=True"
    'txtConn = "Provider=OraOLEDB.Oracle.1;Persist Security Info=False;Password=gvg8ru:u;User ID=akpc;Data Source=orcl"
    
    conn.Open txtConn
    
    frmMainMenu.Show
    'frmLogin.Show
    'frmRollWaitDeclare.Show
    'frmReelLov.Show
    'frmCarIn.Show
    'frmCarOut.Show
    'frmPdRoll.Show
    'frmTestPrint.Show

End Sub

Public Sub txtFocus(txtBox As TextBox)
    txtBox.SetFocus
    txtBox.SelStart = 0
    txtBox.SelLength = Len(txtBox)
End Sub

Public Function chkPermission(varStaffID As Integer, varDepID As Integer, varPermissionID As Integer) As Boolean
    'ตรวจสอบสิทธิ์การใช้งาน
    Dim Sqldp As String
    Dim Rsdp As New ADODB.Recordset
    
    Dim Sqls As String
    Dim Rss As New ADODB.Recordset
    
    Sqldp = "SELECT dp.id " & _
            " From DEPARTMENT_PERMISSION dp " & _
            " WHERE dp.department_id=" & varDepID & " AND dp.permission_id=231 AND ROWNUM=1"
    Rsdp.Open Sqldp, conn
    
    If Rsdp.BOF = True And Rsdp.EOF = True Then
        Sqls = "SELECT s.id " & _
                    "From STAFF_PERMISSION sp, STAFF s " & _
                    " WHERE ROWNUM=1 AND " & _
                    " s.id=sp.staff_id AND sp.staff_id =" & varStaffID & " AND " & _
                    " sp.permission_id = 231 AND s.status='ปกติ'"
        Rss.Open Sqls, conn
        
        If Rss.BOF = True And Rss.EOF = True Then
                chkPermission = False
        Else
                chkPermission = True
        End If
    Else
        chkPermission = True
    End If
End Function

Public Function getDateNow() As String
    Dim Sql As String
    Dim Rs As New ADODB.Recordset
    
    Sql = "select to_char(sysdate,'dd/mm/yyyy hh24:mi') dateNow from dual"
    Rs.Open Sql, conn, adOpenForwardOnly
    
    If Not Rs.BOF And Not Rs.EOF Then
        getDateNow = Rs!dateNow
    End If
    
End Function

Public Sub AddListColumn(lstListView As ListView, ColName As String, itemNo As Integer, ColWidth As Integer, txtTag As String)
    lstListView.ColumnHeaders.Add , , ColName
    
    If itemNo = 1 Then
        lstListView.ColumnHeaders.Item(itemNo).Alignment = lvwColumnLeft
    Else
        lstListView.ColumnHeaders.Item(itemNo).Alignment = lvwColumnCenter
    End If
    lstListView.ColumnHeaders.Item(itemNo).Width = ColWidth
    lstListView.ColumnHeaders.Item(itemNo).Tag = txtTag
    
End Sub

Public Sub SortColumnClick(lstListView As ListView, ByVal ColumnHeader As MSComctlLib.ColumnHeader)
    On Error Resume Next
    
    ' Commence sorting
    With lstListView
     
        ' Prevent the ListView control from updating on screen -
        ' this is to hide the changes being made to the listitems
        ' and also to speed up the sort
        
        LockWindowUpdate .hWnd
        
        ' Check the data type of the column being sorted,
        ' and act accordingly
        Dim l As Long
        Dim strFormat As String
        Dim strData() As String
        
        Dim lngIndex As Long
        lngIndex = ColumnHeader.Index - 1
    
        Select Case UCase$(ColumnHeader.Tag)
        Case "DATE"
        
            ' Sort by date.
            strFormat = "YYYYMMDDHhNnSs"
        
            ' Loop through the values in this column. Re-format
            ' the dates so as they can be sorted alphabetically,
            ' having already stored their visible values in the
            ' tag, along with the tag's original value
            With .ListItems
                If (lngIndex > 0) Then
                    For l = 1 To .Count
                        With .Item(l).ListSubItems(lngIndex)
                            .Tag = .Text & Chr$(0) & .Tag
                            If IsDate(.Text) Then
                                .Text = Format(CDate(.Text), strFormat)
                            Else
                                .Text = ""
                            End If
                        End With
                    Next l
                Else
                    For l = 1 To .Count
                        With .Item(l)
                            .Tag = .Text & Chr$(0) & .Tag
                            If IsDate(.Text) Then
                                .Text = Format(CDate(.Text), strFormat)
                            Else
                                .Text = ""
                            End If
                        End With
                    Next l
                End If
            End With
            
            ' Sort the list alphabetically by this column
            .SortOrder = (.SortOrder + 1) Mod 2
            .SortKey = ColumnHeader.Index - 1
            .Sorted = True
            
            ' Restore the previous values to the 'cells' in this
            ' column of the list from the tags, and also restore
            ' the tags to their original values
            
            With .ListItems
                If (lngIndex > 0) Then
                    For l = 1 To .Count
                        With .Item(l).ListSubItems(lngIndex)
                            strData = Split(.Tag, Chr$(0))
                            .Text = strData(0)
                            .Tag = strData(1)
                        End With
                    Next l
                Else
                    For l = 1 To .Count
                        With .Item(l)
                            strData = Split(.Tag, Chr$(0))
                            .Text = strData(0)
                            .Tag = strData(1)
                        End With
                    Next l
                End If
            End With
            
        Case "NUMBER"
        
            ' Sort Numerically
            strFormat = String(30, "0") & "." & String(30, "0")
        
            ' Loop through the values in this column. Re-format the values so as they
            ' can be sorted alphabetically, having already stored their visible
            ' values in the tag, along with the tag's original value
        
            With .ListItems
                If (lngIndex > 0) Then
                    For l = 1 To .Count
                        With .Item(l).ListSubItems(lngIndex)
                            .Tag = .Text & Chr$(0) & .Tag
                            If IsNumeric(.Text) Then
                                If CDbl(.Text) >= 0 Then
                                    .Text = Format(CDbl(.Text), _
                                        strFormat)
                                Else
                                    .Text = "&" & InvNumber( _
                                        Format(0 - CDbl(.Text), _
                                        strFormat))
                                End If
                            Else
                                .Text = ""
                            End If
                        End With
                    Next l
                Else
                    For l = 1 To .Count
                        With .Item(l)
                            .Tag = .Text & Chr$(0) & .Tag
                            If IsNumeric(.Text) Then
                                If CDbl(.Text) >= 0 Then
                                    .Text = Format(CDbl(.Text), _
                                        strFormat)
                                Else
                                    .Text = "&" & InvNumber( _
                                        Format(0 - CDbl(.Text), _
                                        strFormat))
                                End If
                            Else
                                .Text = ""
                            End If
                        End With
                    Next l
                End If
            End With
            
            ' Sort the list alphabetically by this column
            
            .SortOrder = (.SortOrder + 1) Mod 2
            .SortKey = ColumnHeader.Index - 1
            .Sorted = True
            
            ' Restore the previous values to the 'cells' in this
            ' column of the list from the tags, and also restore
            ' the tags to their original values
            
            With .ListItems
                If (lngIndex > 0) Then
                    For l = 1 To .Count
                        With .Item(l).ListSubItems(lngIndex)
                            strData = Split(.Tag, Chr$(0))
                            .Text = strData(0)
                            .Tag = strData(1)
                        End With
                    Next l
                Else
                    For l = 1 To .Count
                        With .Item(l)
                            strData = Split(.Tag, Chr$(0))
                            .Text = strData(0)
                            .Tag = strData(1)
                        End With
                    Next l
                End If
            End With
        
        Case Else   ' Assume sort by string
            ' Sort alphabetically. This is the only sort provided
            ' by the MS ListView control (at this time), and as
            ' such we don't really need to do much here
        
            .SortOrder = (.SortOrder + 1) Mod 2
            .SortKey = ColumnHeader.Index - 1
            .Sorted = True
            
        End Select
    
        ' Unlock the list window so that the OCX can update it
        LockWindowUpdate 0&
    End With
    
End Sub

'****************************************************************
' InvNumber
' Function used to enable negative numbers to be sorted
' alphabetically by switching the characters
'----------------------------------------------------------------

Private Function InvNumber(ByVal Number As String) As String
    Static i As Integer
    For i = 1 To Len(Number)
        Select Case Mid$(Number, i, 1)
        Case "-": Mid$(Number, i, 1) = " "
        Case "0": Mid$(Number, i, 1) = "9"
        Case "1": Mid$(Number, i, 1) = "8"
        Case "2": Mid$(Number, i, 1) = "7"
        Case "3": Mid$(Number, i, 1) = "6"
        Case "4": Mid$(Number, i, 1) = "5"
        Case "5": Mid$(Number, i, 1) = "4"
        Case "6": Mid$(Number, i, 1) = "3"
        Case "7": Mid$(Number, i, 1) = "2"
        Case "8": Mid$(Number, i, 1) = "1"
        Case "9": Mid$(Number, i, 1) = "0"
        End Select
    Next
    InvNumber = Number
End Function

Public Function GetSq(tbName As String)
    Dim Sql As String
    Dim Rs As New ADODB.Recordset
    
    Sql = "select sq_" & tbName & ".nextval sq from dual"
    Rs.Open Sql, conn, adOpenForwardOnly, adLockReadOnly
    
    GetSq = Rs!sq
End Function
