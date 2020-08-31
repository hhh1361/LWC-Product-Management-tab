import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ProductManagementRow extends NavigationMixin(LightningElement) {
    @api record
    @api index
    get recordId() {
        return this.record.Id;
    }
    get description() {
        if(this.record.Description) {
            return this.record.Description.length > 15 ? this.record.Description.slice(0, 15) + '...' : this.record.Description;
        }
    }

    recordPageUrl
    connectedCallback() {
        console.log(JSON.parse(JSON.stringify(this.record)))
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