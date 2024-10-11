﻿using GumAndHealth.Server.DTOs.ProductsDTOs;
using GumAndHealth.Server.Models;
using PayPal.Api;
using System.Drawing.Printing;
using GumAndHealth.Server.shared;

namespace GumAndHealth.Server.Repositories
{
    public class ProductsRepository(MyDbContext context)
    {
        public PagedResultDto GetPaginatedProduct(ProductFilterDto productFilter)
        {
            const int pageSize = 20;

            // Query the products
            var products = context.Products.AsQueryable();

            // Filter by search
            if (!string.IsNullOrEmpty(productFilter.Search))
            {
                products = products.Where(p => p.Name.Contains(productFilter.Search));
            }

            // Filter by category
            if (productFilter.CategoryId.HasValue)
            {
                products = products.Where(p => p.CategoryId == productFilter.CategoryId.Value);
            }

            // Filter by price range
            if (productFilter.MinPrice.HasValue)
            {
                products = products.Where(p => p.Price >= productFilter.MinPrice.Value);
            }

            if (productFilter.MaxPrice.HasValue)
            {
                products = products.Where(p => p.Price <= productFilter.MaxPrice.Value);
            }

            // Filter by discount availability
            if (productFilter.HasDiscount.HasValue && productFilter.HasDiscount.Value)
            {
                products = products.Where(p => p.Discount.HasValue && p.Discount > 0);
            }

            // Filter by tags
            if (!string.IsNullOrEmpty(productFilter.Tags))
            {
                products = products.Where(p => p.Tags.Contains(productFilter.Tags));
            }

            // Get the total count for pagination
            var totalProducts = products.Count();

            // Pagination
            var paginatedProducts = products
                .Skip((productFilter.Page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
            return new PagedResultDto
            {
                TotalCount = totalProducts,
                TotalPages = (int)Math.Ceiling(totalProducts / (double)pageSize),
                CurrentPage = productFilter.Page,
                PageSize = pageSize,
                Products = paginatedProducts
            };
        }
        public Product CreateProduct(CreateProductDto createProductDto)
        {
            var product = new Product
            {
                AdditionalInformation = createProductDto.AdditionalInformation,
                CategoryId = createProductDto.CategoryId,
                Discount = createProductDto.Discount,
                Description = createProductDto.Description,
                Name = createProductDto.Name,
                Price = createProductDto.Price,
                Tags = createProductDto.Tags,
            };

            if (createProductDto.Image1 != null)
                product.Image1 = ImageSaver.SaveImage(createProductDto.Image1);
            if (createProductDto.Image2 != null)
                product.Image2 = ImageSaver.SaveImage(createProductDto.Image2);
            if (createProductDto.Image3 != null)
                product.Image3 = ImageSaver.SaveImage(createProductDto.Image3);
            if (createProductDto.Image4 != null)
                product.Image4 = ImageSaver.SaveImage(createProductDto.Image4);
            if (createProductDto.Image5 != null)
                product.Image5 = ImageSaver.SaveImage(createProductDto.Image5);
            if (createProductDto.Image6 != null)
                product.Image6 = ImageSaver.SaveImage(createProductDto.Image6);

            context.Products.Add(product);
            context.SaveChanges();
            return product;
        }
    }
}
