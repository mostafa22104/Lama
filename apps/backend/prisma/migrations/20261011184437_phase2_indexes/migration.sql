-- CreateIndex
CREATE INDEX "ChargeAssignment_customerId_idx" ON "ChargeAssignment"("customerId");

-- CreateIndex
CREATE INDEX "ImportJob_businessId_idx" ON "ImportJob"("businessId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_chargeId_idx" ON "Invoice"("chargeId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

