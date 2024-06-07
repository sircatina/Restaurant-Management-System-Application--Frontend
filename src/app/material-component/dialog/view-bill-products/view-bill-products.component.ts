import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BillService } from 'src/app/services/bill.service'; 

@Component({
  selector: 'app-view-bill-products',
  templateUrl: './view-bill-products.component.html',
  styleUrls: ['./view-bill-products.component.scss']
})
export class ViewBillProductsComponent implements OnInit {

  displayedColumns: string[] = ['name', 'email', 'contactNumber', 'paymentMethod', 'total', 'actions'];
  dataSource: any = [];
  bill: any = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    public dialogRef: MatDialogRef<ViewBillProductsComponent>,
    private billService: BillService 
  ) { }

  ngOnInit() {
    this.bill = this.dialogData.data;
    this.dataSource = JSON.parse(this.dialogData.data.productDetails);
  }

  deleteBill(id: number) {
    this.billService.delete(id).subscribe(
      (response: any) => {
        console.log('Bill deleted successfully:', response);
        // Handle any UI updates or notifications
      },
      (error: any) => {
        console.error('Error deleting bill:', error);
        // Handle any error messages or UI updates
      }
    );
  }
  
}
