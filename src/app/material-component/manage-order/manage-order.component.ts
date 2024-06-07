import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { BillService } from 'src/app/services/bill.service';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { GlobalConstants } from 'src/app/shared/global-constants';

@Component({
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss']
})
export class ManageOrderComponent implements OnInit {

  displayedColumns: string[] = ['name', 'category', 'quantity', 'total', 'edit'];
  dataSource: any = [];
  manageOrderForm: any = FormGroup;
  categories: any = [];
  products: any = [];
  price: any;
  totalAmount: number = 0;
  responseMessage: any;

  constructor(private formBuilder: FormBuilder,
              private categoryService: CategoryService,
              private productService: ProductService,
              private snackbarService: SnackbarService,
              private billService: BillService,
              private ngxService: NgxUiLoaderService) { }

  ngOnInit(): void {
    this.ngxService.start();
    this.getCategories();
    this.manageOrderForm = this.formBuilder.group({
      name: [null, [Validators.required, Validators.pattern(GlobalConstants.nameRgex)]],
      email: [null, [Validators.required, Validators.pattern(GlobalConstants.emailRgex)]],
      contactNumber: [null, [Validators.required, Validators.pattern(GlobalConstants.contactNumberRgex)]],
      paymentMethod: [null, [Validators.required]],
      product: [null, [Validators.required]],
      names: [null, [Validators.required]],
      category: [null, [Validators.required]],
      quantity: [null, [Validators.required]],
      price: [null, [Validators.required]],
      total: [0, [Validators.required]]
    });
  }

  getCategories() {
    this.categoryService.getCategories().subscribe(
      (response: any) => {
        this.categories = response;
        this.ngxService.stop();        
      },
      (error: any) => {
        this.ngxService.stop();
        this.responseMessage = error.error?.message || GlobalConstants.genericError;
        this.snackbarService.openSnackBar(this.responseMessage, GlobalConstants.error);
      }
    );
  }
  
  getProductsByCategory(value: any) {
    this.productService.getProductsByCategory(value.id).subscribe(
      (response: any) => {
        this.products = response;
        this.manageOrderForm.controls['quantity'].setValue('');
        this.manageOrderForm.controls['total'].setValue(0);
      },
      (error: any) => {
        console.log(error);
        this.responseMessage = error.error?.message || GlobalConstants.genericError;
        this.snackbarService.openSnackBar(this.responseMessage, GlobalConstants.error);
      }
    );
  }
  
  
  getProductDetails(value: any) {
    this.productService.getById(value.id).subscribe((response: any) => {
      this.price = response.price;
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.price * 1);
    }, (error: any) => {
      console.log(error);
      this.responseMessage = error.error?.message || GlobalConstants.genericError;
      this.snackbarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  setQuantity(value: any) {
    const temp = this.manageOrderForm.controls['quantity'].value;
    if (temp > 0) {
      const totalPrice = temp * this.price;
      this.manageOrderForm.controls['total'].setValue(totalPrice);
    } else if (temp !== '') {
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.price);
    }
  }
  

  validateProductAdd() {
    return this.manageOrderForm.controls['total'].value === 0 ||
           this.manageOrderForm.controls['total'].value === null ||
           this.manageOrderForm.controls['quantity'].value <= 0;
  }

  validateSubmit() {
    return this.totalAmount === 0 || 
           !this.manageOrderForm.controls['name'].value ||
           !this.manageOrderForm.controls['email'].value ||
           !this.manageOrderForm.controls['contactNumber'].value || 
           !this.manageOrderForm.controls['paymentMethod'].value;
  }

  add() {
    const formData = this.manageOrderForm.value;
    const productExists = this.dataSource.find((e: { id: number }) => e.id === formData.product.id);
    if (!productExists) {
      this.totalAmount += formData.total;
      this.dataSource.push({
        id: formData.product.id,
        name: formData.product.name,
        category: formData.category.name,
        quantity: formData.quantity,
        price: formData.price,
        total: formData.total
      });
      this.dataSource = [...this.dataSource];
      this.snackbarService.openSnackBar(GlobalConstants.productAdded, 'success');
    } else {
      this.snackbarService.openSnackBar(GlobalConstants.productExistError, GlobalConstants.error);
    }
  }

  handleDeleteAction(index: number, element: any) {
    this.totalAmount -= element.total;
    this.dataSource.splice(index, 1);
    this.dataSource = [...this.dataSource];
  }

  submitAction() {
    const formData = this.manageOrderForm.value;
    const data = {
      name: formData.name,
      email: formData.email,
      contactNumber: formData.contactNumber,
      paymentMethod: formData.paymentMethod,
      totalAmount: this.totalAmount.toString(),
      productDetails: JSON.stringify(this.dataSource)
    };

    this.ngxService.start();
    this.billService.generateReport(data).subscribe((response: any) => {
      this.downloadFile(response?.uuid);
      this.manageOrderForm.reset();
      this.dataSource = [];
      this.totalAmount = 0;
    }, (error: any) => {
      console.log(error);
      this.responseMessage = error.error?.message || GlobalConstants.genericError;
      this.snackbarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  downloadFile(fileName: string) {
    const data = { uuid: fileName };
    this.billService.getPdf(data).subscribe((response: any) => {
      saveAs(response, `${fileName}.pdf`);
      this.ngxService.stop();
    });
  }
}
