class ExternalDBRouter:
    """
    외부 데이터베이스 라우팅을 관리하는 클래스
    """
    
    def db_for_read(self, model, **hints):
        """외부 DB 모델의 읽기 작업을 외부 DB로 라우팅"""
        if model._meta.app_label == 'external_data':
            return 'external_db'
        return None

    def db_for_write(self, model, **hints):
        """외부 DB 모델의 쓰기 작업을 외부 DB로 라우팅"""
        if model._meta.app_label == 'external_data':
            return 'external_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """관계 허용 여부 결정"""
        db_set = {'default', 'external_db'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """마이그레이션 허용 여부 결정"""
        if app_label == 'external_data':
            return db == 'external_db'
        elif db == 'external_db':
            return False
        return db == 'default' 