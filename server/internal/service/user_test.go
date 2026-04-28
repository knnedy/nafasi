package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/repository/mock"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestUserService(db *mock.UserQueries) *service.UserService {
	return service.NewUserService(db)
}

// GetMe
func TestGetMe_Success(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("GetUserById", mocktestify.Anything, userID).
		Return(repository.User{
			ID:    userID,
			Name:  "John Doe",
			Email: "john@example.com",
		}, nil)

	user, err := svc.GetMe(context.Background(), uuid.UUID(userID.Bytes).String())

	assert.NoError(t, err)
	assert.Equal(t, "john@example.com", user.Email)
	db.AssertExpectations(t)
}

func TestGetMe_InvalidID(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	_, err := svc.GetMe(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrNotFound)
}

func TestGetMe_UserNotFound(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("GetUserById", mocktestify.Anything, userID).
		Return(repository.User{}, errors.New("not found"))

	_, err := svc.GetMe(context.Background(), uuid.UUID(userID.Bytes).String())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

// UpdateProfile
func TestUpdateProfile_Success(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{}, errors.New("not found"))

	db.On("UpdateUserProfile", mocktestify.Anything, repository.UpdateUserProfileParams{
		ID:    userID,
		Name:  "John Doe",
		Email: "john@example.com",
	}).Return(repository.User{
		ID:    userID,
		Name:  "John Doe",
		Email: "john@example.com",
	}, nil)

	user, err := svc.UpdateProfile(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdateProfileInput{
		Name:  "John Doe",
		Email: "john@example.com",
	})

	assert.NoError(t, err)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
	db.AssertExpectations(t)
}

func TestUpdateProfile_EmailTakenByAnotherUser(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()
	otherUserID := makeUserID()

	db.On("GetUserByEmail", mocktestify.Anything, "taken@example.com").
		Return(repository.User{ID: otherUserID}, nil)

	_, err := svc.UpdateProfile(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdateProfileInput{
		Name:  "John Doe",
		Email: "taken@example.com",
	})

	assert.ErrorIs(t, err, response.ErrAlreadyExists)
	db.AssertExpectations(t)
}

func TestUpdateProfile_SameEmailSameUser(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	// email exists but belongs to same user — should be allowed
	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{ID: userID}, nil)

	db.On("UpdateUserProfile", mocktestify.Anything, repository.UpdateUserProfileParams{
		ID:    userID,
		Name:  "John Updated",
		Email: "john@example.com",
	}).Return(repository.User{
		ID:    userID,
		Name:  "John Updated",
		Email: "john@example.com",
	}, nil)

	user, err := svc.UpdateProfile(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdateProfileInput{
		Name:  "John Updated",
		Email: "john@example.com",
	})

	assert.NoError(t, err)
	assert.Equal(t, "John Updated", user.Name)
	db.AssertExpectations(t)
}

func TestUpdateProfile_InvalidInput(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	tests := []struct {
		name  string
		input service.UpdateProfileInput
	}{
		{"empty name", service.UpdateProfileInput{Name: "", Email: "john@example.com"}},
		{"invalid email", service.UpdateProfileInput{Name: "John", Email: "not-an-email"}},
		{"empty email", service.UpdateProfileInput{Name: "John", Email: ""}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.UpdateProfile(context.Background(), uuid.UUID(userID.Bytes).String(), tt.input)
			assert.Error(t, err)
		})
	}
}

// UpdatePassword
func TestUpdatePassword_Success(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("GetUserById", mocktestify.Anything, userID).
		Return(repository.User{
			ID:       userID,
			Password: mustHash("OldPassword1!"),
		}, nil)

	db.On("UpdateUserPassword", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.UpdateUserPasswordParams) bool {
		return p.ID == userID
	})).Return(repository.User{ID: userID}, nil)

	err := svc.UpdatePassword(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdatePasswordInput{
		CurrentPassword: "OldPassword1!",
		NewPassword:     "NewPassword1!",
	})

	assert.NoError(t, err)
	db.AssertExpectations(t)
}

func TestUpdatePassword_WrongCurrentPassword(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("GetUserById", mocktestify.Anything, userID).
		Return(repository.User{
			ID:       userID,
			Password: mustHash("OldPassword1!"),
		}, nil)

	err := svc.UpdatePassword(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdatePasswordInput{
		CurrentPassword: "WrongPassword1!",
		NewPassword:     "NewPassword1!",
	})

	assert.ErrorIs(t, err, response.ErrInvalidCredentials)
	db.AssertExpectations(t)
}

func TestUpdatePassword_WeakNewPassword(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	tests := []struct {
		name     string
		password string
	}{
		{"no uppercase", "newpassword1!"},
		{"no lowercase", "NEWPASSWORD1!"},
		{"no number", "NewPassword!!"},
		{"no special", "NewPassword11"},
		{"too short", "Ne1!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.UpdatePassword(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdatePasswordInput{
				CurrentPassword: "OldPassword1!",
				NewPassword:     tt.password,
			})
			assert.Error(t, err)
		})
	}
}

// UpdateAvatar
func TestUpdateAvatar_Success(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("UpdateUserAvatar", mocktestify.Anything, repository.UpdateUserAvatarParams{
		ID:        userID,
		AvatarUrl: pgtype.Text{String: "https://example.com/avatar.jpg", Valid: true},
	}).Return(repository.User{
		ID:        userID,
		AvatarUrl: pgtype.Text{String: "https://example.com/avatar.jpg", Valid: true},
	}, nil)

	user, err := svc.UpdateAvatar(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdateAvatarInput{
		AvatarURL: "https://example.com/avatar.jpg",
	})

	assert.NoError(t, err)
	assert.Equal(t, "https://example.com/avatar.jpg", user.AvatarUrl.String)
	db.AssertExpectations(t)
}

func TestUpdateAvatar_InvalidURL(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	_, err := svc.UpdateAvatar(context.Background(), uuid.UUID(userID.Bytes).String(), service.UpdateAvatarInput{
		AvatarURL: "not-a-url",
	})

	assert.Error(t, err)
}

// DeleteMe
func TestDeleteMe_Success(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("DeleteUser", mocktestify.Anything, userID).
		Return(nil)

	err := svc.DeleteMe(context.Background(), uuid.UUID(userID.Bytes).String())

	assert.NoError(t, err)
	db.AssertExpectations(t)
}

func TestDeleteMe_InvalidID(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	err := svc.DeleteMe(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrNotFound)
}

func TestDeleteMe_DatabaseError(t *testing.T) {
	db := new(mock.UserQueries)
	svc := newTestUserService(db)

	userID := makeUserID()

	db.On("DeleteUser", mocktestify.Anything, userID).
		Return(errors.New("db error"))

	err := svc.DeleteMe(context.Background(), uuid.UUID(userID.Bytes).String())

	assert.ErrorIs(t, err, response.ErrDatabase)
	db.AssertExpectations(t)
}
