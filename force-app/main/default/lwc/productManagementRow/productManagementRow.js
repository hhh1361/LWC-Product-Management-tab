import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ProductManagementRow extends NavigationMixin(LightningElement) {
    @api record
    @api index
    get recordId() {
        return this.record.Id
    }

    recordPageUrl
    connectedCallback() {
        // Generate a URL to a Product record page
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view',
            },
        }).then(url => {
            this.recordPageUrl = url;
        });
    }
}