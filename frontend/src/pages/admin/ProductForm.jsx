import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, ArrowLeft } from 'lucide-react';
import { productApi, categoryApi } from '../../api/product.api';
import { userApi } from '../../api/user.api';
import { PageSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(id),
    enabled: isEdit,
  });

  const allCategories = categories.flatMap((c) => [c, ...(c.children || [])]);

  const { register, control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '', description: '', price: '', comparePrice: '',
      categoryId: '', tags: '', isFeatured: false, isActive: true,
      options: [], variants: [],
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: 'options' });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });

  useEffect(() => {
    if (product && isEdit) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice || '',
        categoryId: product.categoryId,
        tags: product.tags?.join(', ') || '',
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        options: product.options?.map((opt) => ({
          name: opt.name,
          values: opt.values.map((v) => ({ value: v.value, color: v.color || '' })),
        })) || [],
        variants: product.variants?.map((v) => ({
          sku: v.sku,
          options: JSON.stringify(v.options || {}),
          stock: v.stock,
          price: v.price || '',
        })) || [],
      });
      setImageUrls(product.images || []);
    }
  }, [product, isEdit]);

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? productApi.updateProduct(id, data) : productApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEdit ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
      navigate('/admin/products');
    },
    onError: (err) => toast.error(err.response?.data?.message || '처리에 실패했습니다.'),
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      const { urls } = await userApi.uploadImages(formData);
      setImageUrls((prev) => [...prev, ...urls]);
    } catch {
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (formData) => {
    const tags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const variants = formData.variants.map((v) => ({
      sku: v.sku,
      options: JSON.parse(v.options || '{}'),
      stock: Number(v.stock),
      price: v.price ? Number(v.price) : null,
    }));

    saveMutation.mutate({
      ...formData,
      images: imageUrls,
      tags,
      price: Number(formData.price),
      comparePrice: formData.comparePrice ? Number(formData.comparePrice) : null,
      variants,
      options: formData.options,
    });
  };

  if (isEdit && isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? '상품 수정' : '상품 등록'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        {/* 기본 정보 */}
        <section className="border p-6">
          <h2 className="font-bold mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">상품명 *</label>
              <input {...register('name', { required: true })} className={`input-base ${errors.name ? 'input-error' : ''}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">카테고리 *</label>
              <select {...register('categoryId', { required: true })} className={`input-base ${errors.categoryId ? 'input-error' : ''}`}>
                <option value="">카테고리 선택</option>
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `  ↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">상품 설명 *</label>
              <textarea {...register('description', { required: true })} rows={6} className="input-base resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">판매가 (원) *</label>
                <input {...register('price', { required: true })} type="number" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">원가 (원, 선택)</label>
                <input {...register('comparePrice')} type="number" className="input-base" placeholder="할인 전 가격" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">태그 (쉼표로 구분)</label>
              <input {...register('tags')} className="input-base" placeholder="봄, 트렌디, 기본템" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input {...register('isFeatured')} type="checkbox" />
                신상품/추천 상품으로 표시
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input {...register('isActive')} type="checkbox" defaultChecked />
                판매 활성화
              </label>
            </div>
          </div>
        </section>

        {/* 이미지 */}
        <section className="border p-6">
          <h2 className="font-bold mb-4">상품 이미지</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-28 group">
                <img src={url} alt="" className="w-full h-full object-cover bg-gray-50" onError={(e) => { e.target.src = 'https://placehold.co/96x112/f3f4f6/9ca3af?text=IMG'; }} />
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-white/80 text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-black/70 text-white text-xs py-0.5">대표</span>}
              </div>
            ))}
            <label className={`w-24 h-28 border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer hover:border-gray-600 hover:text-gray-600 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={20} />
              <span className="text-xs">{uploading ? '업로드 중...' : '이미지 추가'}</span>
              <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400">* 첫 번째 이미지가 대표 이미지로 설정됩니다. (최대 5MB, JPG/PNG/WEBP)</p>
        </section>

        {/* 옵션 */}
        <section className="border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">옵션 설정</h2>
            <button
              type="button"
              onClick={() => appendOption({ name: '', values: [{ value: '', color: '' }] })}
              className="flex items-center gap-1 text-sm btn-secondary px-3 py-1.5"
            >
              <Plus size={14} /> 옵션 추가
            </button>
          </div>
          {optionFields.map((option, optIdx) => (
            <div key={option.id} className="border p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <input
                  {...register(`options.${optIdx}.name`)}
                  placeholder="옵션명 (예: 색상, 사이즈)"
                  className="input-base flex-1 text-sm py-2"
                />
                <button type="button" onClick={() => removeOption(optIdx)} className="p-1 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-2 ml-4">
                {(watch(`options.${optIdx}.values`) || []).map((_, valIdx) => (
                  <div key={valIdx} className="flex gap-2">
                    <input
                      {...register(`options.${optIdx}.values.${valIdx}.value`)}
                      placeholder="값 (예: 빨강, M)"
                      className="input-base flex-1 text-sm py-1.5"
                    />
                    <input
                      {...register(`options.${optIdx}.values.${valIdx}.color`)}
                      type="color"
                      className="w-10 h-9 cursor-pointer border border-gray-200 rounded"
                      title="색상 선택 (색상 옵션인 경우)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const values = watch(`options.${optIdx}.values`);
                        const updated = values.filter((_, i) => i !== valIdx);
                        setValue(`options.${optIdx}.values`, updated);
                      }}
                      className="p-1 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const values = watch(`options.${optIdx}.values`) || [];
                    setValue(`options.${optIdx}.values`, [...values, { value: '', color: '' }]);
                  }}
                  className="text-xs text-gray-500 hover:text-black underline"
                >
                  + 값 추가
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 재고 (Variants) */}
        <section className="border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">재고 설정</h2>
            <button
              type="button"
              onClick={() => appendVariant({ sku: `SKU-${Date.now()}`, options: '{}', stock: 0, price: '' })}
              className="flex items-center gap-1 text-sm btn-secondary px-3 py-1.5"
            >
              <Plus size={14} /> 옵션 조합 추가
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            options 형식 예시: {"{"}"색상": "빨강", "사이즈": "M"{"}"}
          </p>
          {variantFields.map((variant, i) => (
            <div key={variant.id} className="flex gap-3 mb-2 items-start">
              <input {...register(`variants.${i}.sku`)} placeholder="SKU" className="input-base text-sm py-2 w-28" />
              <input {...register(`variants.${i}.options`)} placeholder='{"색상":"빨강","사이즈":"M"}' className="input-base text-sm py-2 flex-1" />
              <input {...register(`variants.${i}.stock`)} type="number" placeholder="재고" className="input-base text-sm py-2 w-20" />
              <input {...register(`variants.${i}.price`)} type="number" placeholder="가격(선택)" className="input-base text-sm py-2 w-28" />
              <button type="button" onClick={() => removeVariant(i)} className="p-2 hover:text-red-500 transition-colors mt-0.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-10 py-3 text-sm font-bold">
            {saveMutation.isPending ? '저장 중...' : isEdit ? '수정 완료' : '상품 등록'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary px-6 py-3 text-sm">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
