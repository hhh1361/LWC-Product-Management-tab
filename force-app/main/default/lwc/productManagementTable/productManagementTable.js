import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProducts from '@salesforce/apex/productManagementController.getProducts'
import getPriceBooks from '@salesforce/apex/productManagementController.getPriceBooks'
import getPriceBookEntries from '@salesforce/apex/productManagementController.getPriceBookEntries'

export default class ProductManagementTable extends NavigationMixin(LightningElement) {

    @track columns = [];
    newRecordFields = ['Name', 'Description', 'StockKeepingUnit']

    @track priceBooks;
    @track priceBookEntries = {};
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
        console.log('set: ', value)
    }
    
    // fetch products
    wiredProducts
    @wire(getProducts)
    wireProducts(value) {
        this.wiredProducts = value;
        const { error, data } = value; 
        if (error) {
            this.error = error;
        } else if (data) {
            this.table = data;
            this.defaultTable = data;
        }
    }
    
    //fetch price books
    wiredPriceBooks
    @wire(getPriceBooks)
    wirePriceBooks(value) {
        this.wiredPriceBooks = value;
        const { error, data } = value;
        if (error) {
            this.error = error;
        } else if (data) {
            // create url for price books
            const result = JSON.parse(JSON.stringify(data));
            result.forEach(i => {
                this[NavigationMixin.GenerateUrl]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: i.Id,
                        actionName: 'view',
                    },
                }).then(url => {
                    i.recordPageUrl = url;
                });
            })
            this.priceBooks = result

            const tempColomns = [];
            tempColomns.push({
                name: 'Product Name',
                hasUrl: false
            }, {
                name: 'Description',
                hasUrl: false
            });
            result.forEach( i => tempColomns.push({
                name: i.Name,
                recordPageUrl: i.recordPageUrl,
                hasUrl: true
            }))
            tempColomns.push({
                name: 'Edit/Viev',
                hasUrl: false
            });
            this.columns = tempColomns;
        }
    }

    //fetch price book entries
    wiredPriceBookEntries
    @wire(getPriceBookEntries)
    wirePriceBookEntries(value) {
        this.wiredPriceBookEntries = value;
        const { error, data } = value;
        if (error) {
            this.error = error;
        } else if (data) {
            data.forEach( i => {
                this.priceBookEntries[i.Pricebook2Id + i.Product2Id] = i.UnitPrice;
            });
        }
    }

    isPricesAssign;
    renderedCallback() {
        console.log('connected callback')
        if(this.tableWithPriceEntries && !this.isPricesAssign) {
            console.log('assign prices')
            this.isPricesAssign = true;
            this.table = this.tableWithPriceEntries;
        }
    }


    // fulfill datatable with prices per each product/pricebook
    get tableWithPriceEntries() {
        let priceBooks;
        let priceBookEntries;
        let result;

        if(this.priceBookEntries && this.priceBooks && this.table) {
            priceBooks = JSON.parse(JSON.stringify(this.priceBooks));
            priceBookEntries = JSON.parse(JSON.stringify(this.priceBookEntries));
            result = JSON.parse(JSON.stringify(this.table));

            result.forEach( product => {
                product.prices = [];
                priceBooks.forEach( priceBook => {
                    product.prices.push({
                        pricebook: priceBook.Name,
                        pricebookEntry: priceBookEntries[priceBook.Id + product.Id] ? priceBookEntries[priceBook.Id + product.Id] : null,
                        id: priceBook.Id + product.Id
                    });
                })
            })
            return result;
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
    @track newProductObject = {};
    @track newPriceBookObject = {};
    
    handleNewProductModalOpen() {
        this.template.querySelector("section.newProduct").classList.remove("slds-hide");
        this.template.querySelector("div.modalBackdrops").classList.remove("slds-hide");
    }
    handleNewPriceBookModalOpen() {
        this.template.querySelector("section.newPriceBook").classList.remove("slds-hide");
        this.template.querySelector("div.modalBackdrops").classList.remove("slds-hide");
    }
    handleModalClose() {
        this.template.querySelectorAll("form").forEach(i => i.reset());
        this.template.querySelectorAll("section").forEach(i => i.classList.add("slds-hide"));
        this.template.querySelector("div.modalBackdrops").classList.add("slds-hide");
        this.newProductObject = {};
        this.newPriceBookObject = {};
    }
    createFormProductSave() {
        if(this.newProductObject.Name) {
            this.isLoading = true;
            const recordInput = { apiName: 'Product2', fields: this.newProductObject };
            createRecord(recordInput)
            .then(() => {
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
    createFormPriceBookSave() {
        if(this.newPriceBookObject.Name) {
            this.isLoading = true;
            const recordInput = { apiName: 'Pricebook2', fields: this.newPriceBookObject };
            createRecord(recordInput)
            .then(() => {
                // refreshApex(this.wiredProducts)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Price Book created',
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
                    title: 'Price Book Name is required',
                    message: 'Please complete the Price Book Name field in order to continue.',
                    variant: 'error',
                }),
            );
        }
    }
    createFormProductUpdate(e) {
        this.newProductObject[e.target.name] = e.target.value;
    }
    createFormPriceBookUpdate(e) {
        this.newPriceBookObject[e.target.name] = e.target.value;
    }
}