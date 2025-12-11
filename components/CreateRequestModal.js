'use client';

import React, { useEffect, useState } from 'react';
import InputBox from './InputBox';
import Textarea from './Textarea';
import Button from './Button';
import Dropdown from './Dropdown';

const CreateRequestModal = ({
  show,
  onClose,
  onSubmit,
  requestData,
  setRequestData,
}) => {
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  useEffect(() => {
    if (show) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          console.log('Raw categories from API:', data);
          const sanitized = Array.isArray(data)
            ? data.filter(
                (cat) => cat.id != null && cat.categoryName?.trim() !== ''
              )
            : [];
          console.log('Sanitized categories:', sanitized);
          setCategories(sanitized);
        })
        .catch((err) => {
          console.error('Failed to fetch categories:', err);
          setCategories([]);
        });
    }
  }, [show]);

  if (!show) return null;

  const handleChange = (field) => (e) => {
    setRequestData({ ...requestData, [field]: e.target.value });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBlur = (field) => () => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!requestData.title?.trim()) newErrors.title = 'Title is required';
    if (!requestData.description?.trim())
      newErrors.description = 'Description is required';
    if (
      !requestData.category ||
      typeof requestData.category !== 'object' ||
      !('id' in requestData.category)
    ) {
      newErrors.category = 'Category is required';
    }
    if (!requestData.deadline?.trim()) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const selectedDate = new Date(requestData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past';
      }
    }

    if (requestData.minPrice === '') {
      newErrors.minPrice = 'Minimum price is required';
    } else if (isNaN(parseFloat(requestData.minPrice))) {
      newErrors.minPrice = 'Minimum price must be a number';
    }

    if (requestData.maxPrice === '') {
      newErrors.maxPrice = 'Maximum price is required';
    } else if (isNaN(parseFloat(requestData.maxPrice))) {
      newErrors.maxPrice = 'Maximum price must be a number';
    }

    if (
      requestData.minPrice !== '' &&
      requestData.maxPrice !== '' &&
      parseFloat(requestData.minPrice) > parseFloat(requestData.maxPrice)
    ) {
      newErrors.maxPrice =
        'Max price must be greater than or equal to min price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedFields({
      title: true,
      description: true,
      category: true,
      deadline: true,
      minPrice: true,
      maxPrice: true,
    });

    const isValid = validateForm();
    if (!isValid) return;

    const payload = {
      title: requestData.title.trim(),
      description: requestData.description.trim(),
      deadline: new Date(requestData.deadline).toISOString(),
      minPrice: parseFloat(requestData.minPrice),
      maxPrice: parseFloat(requestData.maxPrice),
      categoryId: String(requestData.category.id),
    };

    console.log('Submitting payload:', payload);

    try {
      await onSubmit(payload);
      setTouchedFields({});
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-transparent pointer-events-auto" />

      <div className="relative z-50 bg-white rounded-lg p-6 w-full max-w-lg shadow-xl border border-gray-200 pointer-events-auto">
        <h2 className="text-xl font-semibold text-[#094074] mb-4">
          Create New Request
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <InputBox
            label="Title"
            name="title"
            value={requestData.title}
            onChange={handleChange('title')}
            onBlur={handleBlur('title')}
            placeholder="Enter request title"
            required
            error={errors.title}
            touched={touchedFields.title}
          />
          <Textarea
            label="Description"
            name="description"
            value={requestData.description}
            onChange={handleChange('description')}
            onBlur={handleBlur('description')}
            placeholder="Describe your request"
            required
            error={errors.description}
            touched={touchedFields.description}
          />
          <Dropdown
            label="Service Category"
            options={categories}
            selected={requestData.category}
            onSelect={(cat) => {
              console.log('Selected category:', cat);
              setRequestData({ ...requestData, category: cat });
              setErrors((prev) => ({ ...prev, category: undefined }));
            }}
            getLabel={(cat) => cat.categoryName}
            onBlur={handleBlur('category')}
            error={errors.category}
            touched={touchedFields.category}
          />
          <InputBox
            label="Deadline"
            name="deadline"
            type="date"
            value={requestData.deadline}
            onChange={handleChange('deadline')}
            onBlur={handleBlur('deadline')}
            required
            error={errors.deadline}
            touched={touchedFields.deadline}
          />
          <div className="flex justify-between gap-3">
            <div className="w-1/2">
              <InputBox
                label="Min Price"
                name="minPrice"
                type="number"
                value={requestData.minPrice}
                onChange={handleChange('minPrice')}
                onBlur={handleBlur('minPrice')}
                required
                error={errors.minPrice}
                touched={touchedFields.minPrice}
              />
            </div>
            <div className="w-1/2">
              <InputBox
                label="Max Price"
                name="maxPrice"
                type="number"
                value={requestData.maxPrice}
                onChange={handleChange('maxPrice')}
                onBlur={handleBlur('maxPrice')}
                required
                error={errors.maxPrice}
                touched={touchedFields.maxPrice}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={onClose}
              color="secondary"
              variant="outline"
              size="base"
              type="button"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="filled"
              size="base"
              type="submit"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;
