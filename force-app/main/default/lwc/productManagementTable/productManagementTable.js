import { LightningElement, wire, api } from 'lwc';
import getProducts from '@salesforce/apex/productManagementController.getProducts'

export default class ProductManagementTable extends LightningElement {

    fields = ['Name', 'Description', 'Pricebook standart', 'Pricebook 1', 'Pricebook 2', 'Edit/Viev']

    @wire(getProducts)
    products


}