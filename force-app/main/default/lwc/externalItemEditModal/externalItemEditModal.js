import { api, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import REFRESH_APEX from '@salesforce/messageChannel/refreshApex__c';
import { publish, MessageContext } from 'lightning/messageService';

export default class ExternalItemEditModal extends LightningModal {
    @api recordId;
    @api fields;
    @wire(MessageContext)
    messageContext;

    submitExternalItemModal(event) {
        event.preventDefault();
        const fieldsEdit = event.detail.fields;
        this.template.querySelector('lightning-record-form').submit(fieldsEdit);
    }
    successExternalItemModal() {
        const message = {
            info: 'refreshApex'
        };
        publish(this.messageContext, REFRESH_APEX, message);
        this.close('success');
    }
    handleCancel(){
        this.close('canceled');
    }
}