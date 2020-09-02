import { LightningElement, wire, api, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProducts from '@salesforce/apex/productManagementController.getProducts'

export default class ProductManagementTable extends LightningElement {

    fields = ['Product Name', 'Description', 'Product Code', 'Pricebook standart', 'Pricebook 1', 'Pricebook 2', 'Edit/Viev']
    newRecordFields = ['Name', 'Description', 'StockKeepingUnit']

	@track activeDataTableRecords = [];
    @track _table;
    @track defaultTable
    @api pagesCount;
    @api recordsCount;
    @api activeRecordsCountToView = 10;
    @api tempRecordsCountToView = 10;
    @api activePageNumber = 1;
    @api tempPageNumber = 1;
    @api tableSize;
    error;
    isLoading = true;
    pageNumberTimeout = null;
    recordsCountToViewTimeout = null;
    
	get table() {
		return this._table;
	}
	set table(value) {
		this._table = value;
		this.setPagination(true);
    }
    
    wiredProducts
    @wire(getProducts)
    wireProducts(value) {
        this.wiredProducts = value;
        const { error, data } = value; 
        if (error) {
            this.error = error;
        } else if (data) {
            console.log(data)
            this.table = data;
            this.defaultTable = data;
        }
    }
    

    // pagination functions
	onChangePaginationClick(event) {
	    if (event.target.dataset.id === 'first') {
	        this.activePageNumber = 1;
		} else if (event.target.dataset.id === 'previous') {
		    if (this.activePageNumber > 1) {
				this.activePageNumber--;
			}
		} else if (event.target.dataset.id === 'next') {
		    if (this.activePageNumber < this.pagesCount) {
				this.activePageNumber++;
			}
		} else if (event.target.dataset.id === 'last') {
			this.activePageNumber = this.pagesCount;
        } else if (event.target.dataset.id === 'page'){
            this.tempPageNumber = event.detail.value;
            // apply value when user stops to write
            clearTimeout(this.pageNumberTimeout)
            this.pageNumberTimeout = setTimeout(() => {
                if (this.tempPageNumber <= this.pagesCount && this.tempPageNumber > 0) {
                    this.activePageNumber = this.tempPageNumber;
                    this.setPagination(false);
                }
            }, 2000);
        } else {
            this.tempRecordsCountToView = event.detail.value;
            // apply value when user stops to write
            clearTimeout(this.recordsCountToViewTimeout)
            this.recordsCountToViewTimeout = setTimeout(() => {
                if (this.tempRecordsCountToView <= this.recordsCount && this.tempRecordsCountToView  > 0) {
                    this.activeRecordsCountToView = this.tempRecordsCountToView
                    this.activePageNumber = 1;
                    this.setPagination(false);
                }
            }, 2000);
		}
		this.setPagination(false);
	}
	onBlurPageNumber() {
        clearTimeout(this.pageNumberTimeout)
		if (this.tempPageNumber <= this.pagesCount && this.tempPageNumber > 0) {
			this.activePageNumber = this.tempPageNumber;
			this.setPagination(false);
		}
		this.tempPageNumber = 1;
    }
    onBlurRecordsCountToViewT() {
        clearTimeout(this.recordsCountToViewTimeout)
		if (this.tempRecordsCountToView <= this.recordsCount && this.tempRecordsCountToView > 0) {
            this.activeRecordsCountToView = this.tempRecordsCountToView;
            this.activePageNumber = 1;
			this.setPagination(false);
		}
		this.tempRecordsCountToView = 10;
    }
	setPagination(haveNewFilters) {
		if (this.table) {
			this.isLoading = true;
			if (haveNewFilters === true) { // Jump to the first page if filter has been changed
				this.activePageNumber = 1;
			}
            this.recordsCount = this._table.length;
			this.pagesCount = Math.ceil(this._table.length / parseInt(this.activeRecordsCountToView));
			this.activeDataTableRecords = [];
			let startRecordIndex = (this.activePageNumber !== 1) ? ((this.activePageNumber - 1) * parseInt(this.activeRecordsCountToView)) : 0;
			let endRecordIndex = this.activePageNumber * parseInt(this.activeRecordsCountToView);
			for (let i = startRecordIndex; i < endRecordIndex; i++) {
				if (this._table[i]) {
					this.activeDataTableRecords.push(this._table[i]);
				}
			}
			this.tableSize = this._table ? this._table.length : this.tableSize;
			this.isLoading = false;
        }
    }
    

    // search record functions
    handleSearchProduct(e) {
        // regexp to implement case insensitive search
        this.table = this.defaultTable.filter( i => (new RegExp(e.target.value, 'i')).test(i.Name));
    }


    // create new record functions
    @track newRecordObject = {};
    handleModalOpen() {
        this.template.querySelector("section").classList.remove("slds-hide");
        this.template.querySelector("div.modalBackdrops").classList.remove("slds-hide");
    }
    handleModalClose() {
        this.template.querySelector("section").classList.add("slds-hide");
        this.template.querySelector("div.modalBackdrops").classList.add("slds-hide");
        this.newRecordObject = {};
        this.template.querySelector('form').reset();
    }
    createRecordSave() {
        if(this.newRecordObject.Name) {
            this.isLoading = true;
            const recordInput = { apiName: 'Product2', fields: this.newRecordObject };
            createRecord(recordInput)
            .then(product => {
                refreshApex(this.wiredProducts)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Product created',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
            this.isLoading = false;
            this.handleModalClose();
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Product Name is required',
                    message: 'Please complete the Product Name field in order to continue.',
                    variant: 'error',
                }),
            );
        }
    }
    createRecordCancel() {
        this.handleModalClose();
    }
    createRecordUpdateField(e) {
        this.newRecordObject[e.target.name] = e.target.value;
    }
}