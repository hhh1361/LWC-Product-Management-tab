import { LightningElement, wire, api, track } from 'lwc';
import getProducts from '@salesforce/apex/productManagementController.getProducts'

export default class ProductManagementTable extends LightningElement {

    fields = ['Product Name', 'Description', 'Product Code', 'Pricebook standart', 'Pricebook 1', 'Pricebook 2', 'Edit/Viev']

	@track activeDataTableRecords = [];
    @track _table;
    @api pagesCount;
    @api recordsCount;
    @api activeRecordsCountToView = 10;
    @api tempRecordsCountToView = 10
    @api activePageNumber = 1;
    @api tempPageNumber = 1;
    @api tableSize;
    error
    isSpinnerShown = true;
    pageNumberTimeout = null;
    recordsCountToViewTimeout = null;
    
	get table() {
		return this._table;
	}
	set table(value) {
		this._table = value;
		this.setPagination(false);
    }
    
    @wire(getProducts)
    fetchProducts({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            console.log(data)
            this.table = data;
        }
    }
    
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
                    this.setPagination(true);
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
                    this.setPagination(true);
                }
            }, 2000);
		}
		this.setPagination(true);
	}

	onBlurPageNumber() {
        clearTimeout(this.pageNumberTimeout)
		if (this.tempPageNumber <= this.pagesCount && this.tempPageNumber > 0) {
			this.activePageNumber = this.tempPageNumber;
			this.setPagination(true);
		}
		this.tempPageNumber = 1;
    }
    
    onBlurRecordsCountToViewT() {
        clearTimeout(this.recordsCountToViewTimeout)
		if (this.tempRecordsCountToView <= this.recordsCount && this.tempRecordsCountToView > 0) {
            this.activeRecordsCountToView = this.tempRecordsCountToView;
            this.activePageNumber = 1;
			this.setPagination(true);
		}
		this.tempRecordsCountToView = 10;
    }

	setPagination(noNewFilters) {
		if (this.table) {
			this.isSpinnerShown = true;
			if (noNewFilters === false) { // Jump to the first page if filter has been changed
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
			this.isSpinnerShown = false;
        }
	}
}