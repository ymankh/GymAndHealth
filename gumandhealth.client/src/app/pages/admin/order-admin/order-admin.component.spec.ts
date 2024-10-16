import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderAdminComponent } from './order-admin.component';

describe('OrderAdminComponent', () => {
  let component: OrderAdminComponent;
  let fixture: ComponentFixture<OrderAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
