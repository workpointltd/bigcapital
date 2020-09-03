import express from 'express';
import { Container } from 'typedi';
import SalesEstimates from './SalesEstimates';
import SalesReceipts from './SalesReceipts';
import SalesInvoices from './SalesInvoices'
import PaymentReceives from './PaymentReceives';

export default {
  /**
   * Router constructor.
   */
  router() {
    const router = express.Router();

    router.use('/invoices', Container.get(SalesInvoices).router());
    router.use('/estimates', Container.get(SalesEstimates).router());
    router.use('/receipts', Container.get(SalesReceipts).router());
    router.use('/payment_receives', Container.get(PaymentReceives).router());

    return router;
  }
}