import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import moment from 'moment';
import { Intent, FormGroup, TextArea } from '@blueprintjs/core';
import { FormattedMessage as T, useIntl } from 'react-intl';
import { pick } from 'lodash';
import { useHistory } from 'react-router-dom';

import ExpenseFormHeader from './ExpenseFormHeader';
import ExpenseTable from './ExpenseTable';
import ExpenseFloatingFooter from './ExpenseFloatingActions';

import withExpensesActions from 'containers/Expenses/withExpensesActions';
import withExpenseDetail from 'containers/Expenses/withExpenseDetail';
import withAccountsActions from 'containers/Accounts/withAccountsActions';
import withDashboardActions from 'containers/Dashboard/withDashboardActions';
import withMediaActions from 'containers/Media/withMediaActions';

import AppToaster from 'components/AppToaster';
import Dragzone from 'components/Dragzone';

import useMedia from 'hooks/useMedia';
import { compose, repeatValue, transformToForm } from 'utils';

const MIN_LINES_NUMBER = 4;
const ERROR = {
  EXPENSE_ALREADY_PUBLISHED: 'EXPENSE.ALREADY.PUBLISHED',
};

/**
 * Expense form.
 */
function ExpenseForm({
  // #withMedia
  requestSubmitMedia,
  requestDeleteMedia,

  //#withExpensesActions
  requestSubmitExpense,
  requestEditExpense,
  requestFetchExpensesTable,
  // #withDashboard
  changePageTitle,
  changePageSubtitle,

  //#withExpenseDetail
  expense,

  // #own Props
  expenseId,
  onFormSubmit,
  onCancelForm,
}) {
  const isNewMode = !expenseId;

  const [payload, setPayload] = useState({});

  const history = useHistory();
  const { formatMessage } = useIntl();

  const {
    setFiles,
    saveMedia,
    deletedFiles,
    setDeletedFiles,
    deleteMedia,
  } = useMedia({
    saveCallback: requestSubmitMedia,
    deleteCallback: requestDeleteMedia,
  });

  const validationSchema = Yup.object().shape({
    beneficiary: Yup.string().label(formatMessage({ id: 'beneficiary' })),
    payment_account_id: Yup.number()
      .required()
      .label(formatMessage({ id: 'payment_account_' })),
    payment_date: Yup.date()
      .required()
      .label(formatMessage({ id: 'payment_date_' })),
    reference_no: Yup.string().min(1).max(255),
    currency_code: Yup.string()
      .nullable()
      .label(formatMessage({ id: 'currency_code' })),
    description: Yup.string()
      .trim()
      .min(1)
      .max(1024)
      .label(formatMessage({ id: 'description' })),
    publish: Yup.boolean().label(formatMessage({ id: 'publish' })),
    categories: Yup.array().of(
      Yup.object().shape({
        index: Yup.number().min(1).max(1000).nullable(),
        amount: Yup.number().decimalScale(13).nullable(),
        expense_account_id: Yup.number()
          .nullable()
          .when(['amount'], {
            is: (amount) => amount,
            then: Yup.number().required(),
          }),
        description: Yup.string().nullable(),
      }),
    ),
  });

  const handleDropFiles = useCallback((_files) => {
    setFiles(_files.filter((file) => file.uploaded === false));
  }, []);

  const savedMediaIds = useRef([]);
  const clearSavedMediaIds = () => {
    savedMediaIds.current = [];
  };

  useEffect(() => {
    if (expense && expense.id) {
      changePageTitle(formatMessage({ id: 'edit_expense' }));
    } else {
      changePageTitle(formatMessage({ id: 'new_expense' }));
    }
  }, [changePageTitle, expense, formatMessage]);

  const saveInvokeSubmit = useCallback(
    (payload) => {
      onFormSubmit && onFormSubmit(payload);
    },
    [onFormSubmit],
  );

  const defaultCategory = useMemo(
    () => ({
      index: 0,
      amount: 0,
      expense_account_id: null,
      description: '',
    }),
    [],
  );

  const defaultInitialValues = useMemo(
    () => ({
      payment_account_id: '',
      beneficiary: '',
      payment_date: moment(new Date()).format('YYYY-MM-DD'),
      description: '',
      reference_no: '',
      currency_code: '',
      categories: [...repeatValue(defaultCategory, MIN_LINES_NUMBER)],
    }),
    [defaultCategory],
  );

  const orderingCategoriesIndex = (categories) => {
    return categories.map((category, index) => ({
      ...category,
      index: index + 1,
    }));
  };

  const initialValues = useMemo(
    () => ({
      ...(expense
        ? {
            ...pick(expense, Object.keys(defaultInitialValues)),
            categories: [
              ...expense.categories.map((category) => ({
                ...pick(category, Object.keys(defaultCategory)),
              })),
              // ...repeatValue(
              //   defaultCategory,
              //   Math.max(MIN_LINES_NUMBER - expense.categories.length, 0),
              // ),
            ],
          }
        : {
            ...defaultInitialValues,
            categories: orderingCategoriesIndex(
              defaultInitialValues.categories,
            ),
          }),
    }),
    [expense, defaultInitialValues, defaultCategory],
  );

  const initialAttachmentFiles = useMemo(() => {
    return expense && expense.media
      ? expense.media.map((attach) => ({
          preview: attach.attachment_file,
          uploaded: true,
          metadata: { ...attach },
        }))
      : [];
  }, [expense]);

  // Transform API errors in toasts messages.
  const transformErrors = (errors, { setErrors }) => {
    const hasError = (errorType) => errors.some((e) => e.type === errorType);

    if (hasError(ERROR.EXPENSE_ALREADY_PUBLISHED)) {
      setErrors(
        AppToaster.show({
          message: formatMessage({
            id: 'the_expense_is_already_published',
          }),
        }),
      );
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setFieldValue,
    handleSubmit,
    getFieldProps,
  } = useFormik({
    enableReinitialize: true,
    validationSchema,
    initialValues: {
      ...initialValues,
    },
    onSubmit: (values, { setSubmitting, setErrors, resetForm }) => {
      setSubmitting(true);
      const totalAmount = values.categories.reduce((total, item) => {
        return total + item.amount;
      }, 0);

      if (totalAmount <= 0) {
        AppToaster.show({
          message: formatMessage({
            id: 'amount_cannot_be_zero_or_empty',
          }),
          intent: Intent.DANGER,
        });
        return;
      }

      const categories = values.categories.filter(
        (category) =>
          category.amount && category.index && category.expense_account_id,
      );

      const form = {
        ...values,
        publish: payload.publish,
        categories,
      };
      const saveExpense = (mdeiaIds) =>
        new Promise((resolve, reject) => {
          const requestForm = { ...form, media_ids: mdeiaIds };

          if (expense && expense.id) {
            requestEditExpense(expense.id, requestForm)
              .then((response) => {
                AppToaster.show({
                  message: formatMessage(
                    { id: 'the_expense_has_been_successfully_edited' },
                    { number: values.payment_account_id },
                  ),
                  intent: Intent.SUCCESS,
                });
                setSubmitting(false);
                saveInvokeSubmit({ action: 'update', ...payload });
                clearSavedMediaIds([]);
                resetForm();
              })
              .catch((errors) => {
                transformErrors(errors, { setErrors });
                setSubmitting(false);
              });
          } else {
            requestSubmitExpense(requestForm)
              .then((response) => {
                AppToaster.show({
                  message: formatMessage(
                    { id: 'the_expense_has_been_successfully_created' },
                    { number: values.payment_account_id },
                  ),
                  intent: Intent.SUCCESS,
                });
                setSubmitting(false);
                resetForm();
                saveInvokeSubmit({ action: 'new', ...payload });
                clearSavedMediaIds();
              })
              .catch((errors) => {
                transformErrors(errors, { setErrors });
                setSubmitting(false);
              });
          }
        });

      Promise.all([saveMedia(), deleteMedia()])
        .then(([savedMediaResponses]) => {
          const mediaIds = savedMediaResponses.map((res) => res.data.media.id);
          savedMediaIds.current = mediaIds;
          return savedMediaResponses;
        })
        .then(() => {
          return saveExpense(savedMediaIds.current);
        });
    },
  });

  const handleSubmitClick = useCallback(() => {
    setPayload({ publish: true, redirect: true });
  }, [setPayload]);

  const handleCancelClick = useCallback(() => {
    history.goBack();
  }, []);

  const handleSubmitAndNewClick = useCallback(() => {
    setPayload({ publish: true, redirect: false });
  });
  const handleSubmitAndDraftClick = useCallback(() => {
    setPayload({ publish: false, redirect: false });
  });

  const handleDeleteFile = useCallback(
    (_deletedFiles) => {
      _deletedFiles.forEach((deletedFile) => {
        if (deletedFile.uploaded && deletedFile.metadata.id) {
          setDeletedFiles([...deletedFiles, deletedFile.metadata.id]);
        }
      });
    },
    [setDeletedFiles, deletedFiles],
  );

  // Handle click on add a new line/row.
  const handleClickAddNewRow = () => {
    setFieldValue(
      'categories',
      orderingCategoriesIndex([...values.categories, defaultCategory]),
    );
  };

  const handleClearAllLines = () => {
    setFieldValue(
      'categories',
      orderingCategoriesIndex([
        ...repeatValue(defaultCategory, MIN_LINES_NUMBER),
      ]),
    );
  };

  return (
    <div className={'expense-form'}>
      <form onSubmit={handleSubmit}>
        <ExpenseFormHeader
          errors={errors}
          touched={touched}
          values={values}
          setFieldValue={setFieldValue}
          getFieldProps={getFieldProps}
        />

        <ExpenseTable
          categories={values.categories}
          onClickAddNewRow={handleClickAddNewRow}
          onClickClearAllLines={handleClearAllLines}
          errors={errors}
          setFieldValue={setFieldValue}
          defaultRow={defaultCategory}
        />
        <div class="expense-form-footer">
          <FormGroup
            label={<T id={'description'} />}
            className={'form-group--description'}
          >
            <TextArea growVertically={true} {...getFieldProps('description')} />
          </FormGroup>

          <Dragzone
            initialFiles={initialAttachmentFiles}
            onDrop={handleDropFiles}
            onDeleteFile={handleDeleteFile}
            hint={'Attachments: Maxiumum size: 20MB'}
          />
        </div>

        <ExpenseFloatingFooter
          isSubmitting={isSubmitting}
          onSubmitClick={handleSubmitClick}
          onCancelClick={handleCancelClick}
          onDraftClick={handleSubmitAndDraftClick}
          onSubmitAndNewClick={handleSubmitAndNewClick}
          expense={expense}
        />
      </form>
    </div>
  );
}

export default compose(
  withExpensesActions,
  withAccountsActions,
  withDashboardActions,
  withMediaActions,
  withExpenseDetail(),
)(ExpenseForm);
