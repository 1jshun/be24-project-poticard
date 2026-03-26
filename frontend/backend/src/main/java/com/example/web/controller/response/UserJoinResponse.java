package com.example.web.controller.response;

import com.example.web.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public
class UserJoinResponse {
    private Integer id;
    private String email;
    private String userName;

    public static UserJoinResponse fromUser(User user) {
        return new UserJoinResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername()
        );
    }

}
