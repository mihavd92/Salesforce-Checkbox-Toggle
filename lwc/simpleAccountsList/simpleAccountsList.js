import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getSimpleAccounts from '@salesforce/apex/SimpleAccountsController.getSimpleAccounts';
import updateAccountValidation from '@salesforce/apex/SimpleAccountsController.updateAccountValidation';

const COLUMNS = [
    {
        label: 'Account Name',
        fieldName: 'recordUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        },
        sortable: true
    },
    {
        label: 'Billing State',
        fieldName: 'BillingState',
        type: 'text'
    },
    {
        label: 'Phone',
        fieldName: 'Phone',
        type: 'text'
    },
    {
        label: 'Type',
        fieldName: 'Type',
        type: 'text'
    },
    {
        label: 'Validated', 
        fieldName: 'Validated__c', 
        type: 'toggle',       
        editable: false,
        typeAttributes: {
            value: { fieldName: 'Validated__c' },
            context: { fieldName: 'Id' },
            ontoggelselect: { fieldName: 'ontoggelselect' }
        }
    }
];

export default class SimpleAccountsList extends LightningElement {
    @track accounts = [];
    @track columns = COLUMNS;
    @track isLoading = false;
    @track error;
    @track draftValues = [];
    
    wiredAccountsResult;

    @wire(getSimpleAccounts)
    wiredAccounts(result) {
        this.wiredAccountsResult = result;
        if (result.data) {
            this.accounts = result.data.map(account => ({
                ...account,
                recordUrl: `/lightning/r/Account/${account.Id}/view`
            }));
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.accounts = [];
            this.showToast('Error', 'Error loading accounts: ' + result.error.body.message, 'error');
        }
    }

    handleToggleChange(event) {
        const accountId = event.target.dataset.accountId;
        const newValidatedValue = event.target.checked;
        
        const previousValue = !newValidatedValue;
        
        this.accounts = this.accounts.map(account => {
            if (account.Id === accountId) {
                return { ...account, Validated__c: newValidatedValue };
            }
            return account;
        });

        updateAccountValidation({ accountId: accountId, validated: newValidatedValue })
            .then(() => {
                this.showToast('Success', 'Account validation updated successfully', 'success');
            })
            .catch(error => {
                console.error('Error updating account validation:', error);
                
                this.accounts = this.accounts.map(account => {
                    if (account.Id === accountId) {
                        return { ...account, Validated__c: previousValue };
                    }
                    return account;
                });
                
                this.showToast('Error', 'Failed to update account validation: ' + (error.body?.message || error.message), 'error');
            });
    }

    handleSave(event) {
        const draftValues = event.detail.draftValues;
        const recordInputs = draftValues.map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        
        Promise.all(promises)
            .then(() => {
                this.showToast('Success', 'Records updated successfully', 'success');
                this.draftValues = [];
                return refreshApex(this.wiredAccountsResult);
            })
            .catch(error => {
                console.error('Error updating records:', error);
                this.showToast('Error', 'Failed to update records: ' + (error.body?.message || error.message), 'error');
            });
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}